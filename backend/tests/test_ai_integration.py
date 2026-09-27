import unittest
from uuid import UUID

from backend.schemas.common import UserRole
from backend.schemas.possible_matches import PossibleMatchCreate
from backend.security.auth import CurrentUser
from backend.services import possible_matches
from backend.services.photo_match import PhotoMatchResult, PhotoMatchService, safe_analyze

CASE_ID = UUID("33333333-3333-3333-3333-333333333333")
PROFILE_ID = UUID("11111111-1111-1111-1111-111111111111")


class RaisingMatcher(PhotoMatchService):
    def analyze(self, source_image_url: str, candidate_image_url: str) -> PhotoMatchResult:
        raise RuntimeError("model unavailable")


class MalformedMatcher(PhotoMatchService):
    def analyze(self, source_image_url: str, candidate_image_url: str) -> object:
        return object()


class ValidMatcher(PhotoMatchService):
    def analyze(self, source_image_url: str, candidate_image_url: str) -> PhotoMatchResult:
        return PhotoMatchResult(similarity_score=0.84, model_version="aditya-test-v1", available=True)


class FakeDatabase:
    def __init__(self) -> None:
        self.case = {"id": str(CASE_ID), "created_by": str(PROFILE_ID), "case_manager_id": str(PROFILE_ID)}
        self.match = None

    def case_by_id(self, case_id: str) -> dict | None:
        return self.case if case_id == str(CASE_ID) else None

    def list_case_memberships_for_user(self, profile_id: str) -> list[dict]:
        return [{"case_id": str(CASE_ID), "user_id": profile_id, "status": "ACTIVE", "left_at": None}]

    def missing_person_photo_by_case(self, case_id: str) -> str | None:
        return "https://example.com/source.jpg"

    def create_possible_match(self, values: dict) -> dict:
        self.match = {"id": str(UUID("22222222-2222-2222-2222-222222222222")), "created_at": "2026-01-01T00:00:00Z", **values}
        return self.match

    def create_timeline_event(self, values: dict) -> dict:
        return values

    def create_notification(self, values: dict) -> dict:
        return values


def current() -> CurrentUser:
    return CurrentUser(UUID("44444444-4444-4444-4444-444444444444"), {"id": str(PROFILE_ID), "role": UserRole.VOLUNTEER, "is_active": True, "is_verified": True})


class AIIntegrationTests(unittest.TestCase):
    def test_actual_adapter_reports_unavailable_without_fabricating(self) -> None:
        result = PhotoMatchService().analyze("https://example.com/source.jpg", "https://example.com/candidate.jpg")
        self.assertFalse(result.available)
        self.assertIsNone(result.similarity_score)
        self.assertIsNone(result.model_version)

    def test_valid_output_is_preserved(self) -> None:
        result = safe_analyze(ValidMatcher(), "source", "candidate")
        self.assertEqual(result.similarity_score, 0.84)
        self.assertEqual(result.model_version, "aditya-test-v1")

    def test_malformed_and_exception_outputs_are_unavailable(self) -> None:
        for matcher in (MalformedMatcher(), RaisingMatcher()):
            result = safe_analyze(matcher, "source", "candidate")
            self.assertFalse(result.available)
            self.assertIsNone(result.similarity_score)

    def test_possible_match_stores_only_real_valid_score(self) -> None:
        database = FakeDatabase()
        created = possible_matches.submit(database, current(), CASE_ID, PossibleMatchCreate(candidate_image_url="https://example.com/candidate.jpg"), ValidMatcher())
        self.assertEqual(created["similarity_score"], 0.84)
        self.assertEqual(created["model_version"], "aditya-test-v1")
        self.assertEqual(created["status"], "PENDING")

        unavailable = possible_matches.submit(database, current(), CASE_ID, PossibleMatchCreate(candidate_image_url="https://example.com/candidate.jpg"), RaisingMatcher())
        self.assertIsNone(unavailable["similarity_score"])
        self.assertIsNone(unavailable["model_version"])
        self.assertEqual(unavailable["status"], "REVIEW_REQUIRED")


if __name__ == "__main__":
    unittest.main()