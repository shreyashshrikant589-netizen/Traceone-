import unittest
from uuid import UUID

from fastapi import HTTPException

from backend.schemas.common import UserRole
from backend.security.auth import CurrentUser
from backend.services import cases

CASE_ID = UUID("33333333-3333-3333-3333-333333333333")
MANAGER_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
VOLUNTEER_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")


def user(role: UserRole, profile_id: UUID = MANAGER_ID) -> CurrentUser:
    return CurrentUser(UUID("cccccccc-cccc-cccc-cccc-cccccccccccc"), {"id": str(profile_id), "role": role, "is_active": True, "is_verified": True})


class FakeDatabase:
    def __init__(self, case_status: str = "PUBLIC_SEARCH") -> None:
        self.case = {"id": str(CASE_ID), "created_by": str(MANAGER_ID), "case_manager_id": str(MANAGER_ID), "status": case_status}
        self.timeline = []
        self.notifications = []

    def case_by_id(self, case_id: str) -> dict | None:
        return self.case if case_id == str(CASE_ID) else None

    def update_case(self, case_id: str, values: dict) -> dict:
        self.case.update(values)
        return self.case

    def create_timeline_event(self, values: dict) -> dict:
        self.timeline.append(values)
        return values

    def list_case_members(self, case_id: str) -> list[dict]:
        return [{"user_id": str(VOLUNTEER_ID), "status": "ACTIVE", "left_at": None}]

    def create_notification(self, values: dict) -> dict:
        self.notifications.append(values)
        return values


class CaseResolutionTests(unittest.TestCase):
    def test_manager_can_resolve_and_close(self) -> None:
        database = FakeDatabase()
        resolved = cases.resolve_case(database, user(UserRole.CASE_MANAGER), CASE_ID)
        self.assertEqual(resolved["status"], "RESOLVED")
        self.assertIsNotNone(resolved["resolved_at"])
        self.assertEqual(database.timeline[-1]["event_type"], "CASE_RESOLVED")
        self.assertTrue(database.notifications)
        closed = cases.close_case(database, user(UserRole.CASE_MANAGER), CASE_ID)
        self.assertEqual(closed["status"], "CLOSED")
        self.assertIsNotNone(closed["closed_at"])
        self.assertEqual(database.timeline[-1]["event_type"], "CASE_CLOSED")

    def test_unauthorized_and_invalid_transitions_are_rejected(self) -> None:
        database = FakeDatabase()
        with self.assertRaisesRegex(HTTPException, "authorized"):
            cases.resolve_case(database, user(UserRole.VOLUNTEER, VOLUNTEER_ID), CASE_ID)
        with self.assertRaisesRegex(HTTPException, "resolved"):
            cases.close_case(database, user(UserRole.CASE_MANAGER), CASE_ID)
        with self.assertRaisesRegex(HTTPException, "Cannot resolve"):
            cases.resolve_case(FakeDatabase("CLOSED"), user(UserRole.CASE_MANAGER), CASE_ID)


if __name__ == "__main__":
    unittest.main()
