import unittest
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from pydantic import ValidationError

from backend.schemas.common import UserRole
from backend.schemas.possible_matches import PossibleMatchCreate, PossibleMatchReview, PossibleMatchStatus
from backend.security.auth import CurrentUser
from backend.services import possible_matches

CASE_ID = UUID("33333333-3333-3333-3333-333333333333")
OTHER_CASE_ID = UUID("44444444-4444-4444-4444-444444444444")
MATCH_ID = UUID("55555555-5555-5555-5555-555555555555")
MANAGER_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
VOLUNTEER_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")


def current(role: UserRole, profile_id: UUID = VOLUNTEER_ID, active: bool = True, verified: bool = True) -> CurrentUser:
    return CurrentUser(UUID("cccccccc-cccc-cccc-cccc-cccccccccccc"), {"id": str(profile_id), "role": role, "is_active": active, "is_verified": verified})


class FakeDatabase:
    def __init__(self, source_photo: str | None = "https://example.com/source.jpg") -> None:
        now = datetime.now(timezone.utc).isoformat()
        self.case = {"id": str(CASE_ID), "created_by": str(MANAGER_ID), "case_manager_id": str(MANAGER_ID)}
        self.source_photo = source_photo
        self.matches = []
        self.memberships = [{"case_id": str(CASE_ID), "user_id": str(VOLUNTEER_ID), "status": "ACTIVE", "left_at": None}]
        self.timeline = []
        self.notifications = []
        self.now = now

    def case_by_id(self, case_id: str) -> dict | None:
        return self.case if case_id == str(CASE_ID) else None

    def list_case_memberships_for_user(self, profile_id: str) -> list[dict]:
        return [row for row in self.memberships if row["user_id"] == profile_id]

    def missing_person_photo_by_case(self, case_id: str) -> str | None:
        return self.source_photo if case_id == str(CASE_ID) else None

    def create_possible_match(self, values: dict) -> dict:
        row = {"id": str(MATCH_ID), "created_at": self.now, **values}
        self.matches.append(row)
        return row

    def list_possible_matches(self, case_id: str) -> list[dict]:
        return [row for row in self.matches if row["case_id"] == case_id]

    def possible_match_by_id(self, case_id: str, match_id: str) -> dict | None:
        return next((row for row in self.matches if row["case_id"] == case_id and row["id"] == match_id), None)

    def update_possible_match(self, case_id: str, match_id: str, values: dict) -> dict:
        row = self.possible_match_by_id(case_id, match_id)
        row.update(values)
        return row

    def create_timeline_event(self, values: dict) -> dict:
        self.timeline.append(values)
        return values

    def create_notification(self, values: dict) -> dict:
        self.notifications.append(values)
        return values

    def list_case_members(self, case_id: str) -> list[dict]:
        return self.memberships


class PossibleMatchTests(unittest.TestCase):
    def test_verified_member_submission_is_server_owned_and_scoreless(self) -> None:
        database = FakeDatabase()
        result = possible_matches.submit(database, current(UserRole.VOLUNTEER), CASE_ID, PossibleMatchCreate(candidate_image_url="https://example.com/candidate.jpg"))
        self.assertEqual(result["reported_by"], str(VOLUNTEER_ID))
        self.assertEqual(result["status"], "REVIEW_REQUIRED")
        self.assertIsNone(result["similarity_score"])
        self.assertIsNone(result["model_version"])
        self.assertEqual(result["source_image_url"], "https://example.com/source.jpg")
        self.assertEqual(database.timeline[-1]["event_type"], "POSSIBLE_MATCH")
        self.assertTrue(any(item["type"] == "POSSIBLE_MATCH" for item in database.notifications))

    def test_inactive_unverified_and_nonmember_are_rejected(self) -> None:
        database = FakeDatabase()
        with self.assertRaises(HTTPException):
            possible_matches.submit(database, current(UserRole.VOLUNTEER, active=False), CASE_ID, PossibleMatchCreate(candidate_image_url="https://example.com/candidate.jpg"))
        with self.assertRaises(HTTPException):
            possible_matches.submit(database, current(UserRole.VOLUNTEER, verified=False), CASE_ID, PossibleMatchCreate(candidate_image_url="https://example.com/candidate.jpg"))
        with self.assertRaisesRegex(HTTPException, "active member"):
            possible_matches.submit(database, current(UserRole.VOLUNTEER, UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")), CASE_ID, PossibleMatchCreate(candidate_image_url="https://example.com/candidate.jpg"))

    def test_source_photo_and_candidate_url_are_required(self) -> None:
        with self.assertRaises(ValidationError):
            PossibleMatchCreate(candidate_image_url="not-a-url")
        with self.assertRaisesRegex(HTTPException, "source photo"):
            possible_matches.submit(FakeDatabase(None), current(UserRole.VOLUNTEER), CASE_ID, PossibleMatchCreate(candidate_image_url="https://example.com/candidate.jpg"))

    def test_list_and_cross_case_access_are_scoped(self) -> None:
        database = FakeDatabase()
        possible_matches.submit(database, current(UserRole.VOLUNTEER), CASE_ID, PossibleMatchCreate(candidate_image_url="https://example.com/candidate.jpg"))
        self.assertEqual(len(possible_matches.list_matches(database, current(UserRole.VOLUNTEER), CASE_ID)), 1)
        with self.assertRaisesRegex(HTTPException, "not found"):
            possible_matches.get_match(database, current(UserRole.VOLUNTEER), OTHER_CASE_ID, MATCH_ID)

    def test_manager_confirms_and_rejects_only_once(self) -> None:
        database = FakeDatabase()
        possible_matches.submit(database, current(UserRole.VOLUNTEER), CASE_ID, PossibleMatchCreate(candidate_image_url="https://example.com/candidate.jpg"))
        confirmed = possible_matches.review(database, current(UserRole.CASE_MANAGER, MANAGER_ID), CASE_ID, MATCH_ID, PossibleMatchReview(decision=PossibleMatchStatus.CONFIRMED))
        self.assertEqual(confirmed["status"], "CONFIRMED")
        self.assertEqual(confirmed["reviewed_by"], str(MANAGER_ID))
        with self.assertRaisesRegex(HTTPException, "already been reviewed"):
            possible_matches.review(database, current(UserRole.CASE_MANAGER, MANAGER_ID), CASE_ID, MATCH_ID, PossibleMatchReview(decision=PossibleMatchStatus.REJECTED))

    def test_volunteer_cannot_review_and_rejection_works(self) -> None:
        database = FakeDatabase()
        possible_matches.submit(database, current(UserRole.VOLUNTEER), CASE_ID, PossibleMatchCreate(candidate_image_url="https://example.com/candidate.jpg"))
        with self.assertRaisesRegex(HTTPException, "case manager"):
            possible_matches.review(database, current(UserRole.VOLUNTEER), CASE_ID, MATCH_ID, PossibleMatchReview(decision=PossibleMatchStatus.REJECTED))
        rejected = possible_matches.review(database, current(UserRole.CASE_MANAGER, MANAGER_ID), CASE_ID, MATCH_ID, PossibleMatchReview(decision=PossibleMatchStatus.REJECTED))
        self.assertEqual(rejected["status"], "REJECTED")
        self.assertIsNotNone(rejected["reviewed_at"])


if __name__ == "__main__":
    unittest.main()