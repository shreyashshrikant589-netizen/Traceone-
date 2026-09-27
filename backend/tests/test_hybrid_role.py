import unittest
from unittest.mock import MagicMock
from uuid import UUID

from fastapi import HTTPException

from backend.services import cases as case_service
from backend.security.auth import CurrentUser, UserRole, can_manage_case

# Constants for test IDs
PROFILE_A = UUID("11111111-1111-1111-1111-111111111111")
PROFILE_B = UUID("22222222-2222-2222-2222-222222222222")
CASE_ID_A = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
CASE_ID_B = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")

class TestHybridVolunteerRole(unittest.TestCase):
    def setUp(self) -> None:
        # Mock database with minimal required methods
        self.db = MagicMock()
        # Base case payload for creation
        self.create_payload = MagicMock()
        self.create_payload.model_dump.return_value = {"title": "Test Case"}

    def test_volunteer_creator_is_manager(self):
        """Scenario 1: Volunteer creates a case and can manage it."""
        user_a = CurrentUser(auth_user_id=PROFILE_A, profile={"id": str(PROFILE_A), "role": UserRole.VOLUNTEER})
        # Mock DB create_case to return a case dict with proper fields
        self.db.create_case.return_value = {
            "id": str(CASE_ID_A),
            "title": "Test Case",
            "created_by": str(PROFILE_A),
            "case_manager_id": str(PROFILE_A),
        }
        case = case_service.create_case(self.db, user_a, self.create_payload)
        self.assertEqual(case["created_by"], str(PROFILE_A))
        self.assertEqual(case["case_manager_id"], str(PROFILE_A))
        # Now attempt to update the case – should succeed (no exception)
        self.db.case_by_id.return_value = case
        self.db.update_case.return_value = {**case, "title": "Updated Title"}
        updated = case_service.update_case(self.db, user_a, CASE_ID_A, MagicMock(model_dump=lambda exclude_none=True: {"title": "Updated Title"}))
        self.assertEqual(updated["title"], "Updated Title")

    def test_volunteer_cannot_manage_others_case(self):
        """Scenario 2: Same volunteer attempts manager operation on a case they did not create."""
        user_a = CurrentUser(auth_user_id=PROFILE_A, profile={"id": str(PROFILE_A), "role": UserRole.VOLUNTEER})
        other_case = {
            "id": str(CASE_ID_B),
            "title": "Other Case",
            "created_by": str(PROFILE_B),
            "case_manager_id": None,
        }
        self.db.case_by_id.return_value = other_case
        with self.assertRaises(HTTPException) as ctx:
            case_service.update_case(self.db, user_a, CASE_ID_B, MagicMock(model_dump=lambda exclude_none=True: {"title": "Hack"}))
        self.assertEqual(ctx.exception.status_code, 403)

    def test_other_volunteer_member_cannot_manage_case(self):
        """Scenario 3: Another volunteer who is a member of the case cannot perform manager‑only actions."""
        creator = CurrentUser(auth_user_id=PROFILE_A, profile={"id": str(PROFILE_A), "role": UserRole.VOLUNTEER})
        case = {
            "id": str(CASE_ID_A),
            "title": "Test Case",
            "created_by": str(PROFILE_A),
            "case_manager_id": str(PROFILE_A),
        }
        member = CurrentUser(auth_user_id=PROFILE_B, profile={"id": str(PROFILE_B), "role": UserRole.VOLUNTEER})
        self.db.case_by_id.return_value = case
        # can_manage_case should be False for the member
        self.assertFalse(can_manage_case(member, case))
        with self.assertRaises(HTTPException) as ctx:
            case_service.update_case(self.db, member, CASE_ID_A, MagicMock(model_dump=lambda exclude_none=True: {"title": "Attempt"}))
        self.assertEqual(ctx.exception.status_code, 403)

    def test_dedicated_case_manager_has_full_access(self):
        """Scenario 4: Existing CASE_MANAGER role retains its permissions."""
        manager_user = CurrentUser(auth_user_id=PROFILE_A, profile={"id": str(PROFILE_A), "role": UserRole.CASE_MANAGER})
        case = {
            "id": str(CASE_ID_A),
            "title": "Managed Case",
            "created_by": str(PROFILE_B),
            "case_manager_id": str(PROFILE_A),
        }
        self.assertTrue(can_manage_case(manager_user, case))
        self.db.case_by_id.return_value = case
        self.db.update_case.return_value = {**case, "title": "Mgr Updated"}
        updated = case_service.update_case(self.db, manager_user, CASE_ID_A, MagicMock(model_dump=lambda exclude_none=True: {"title": "Mgr Updated"}))
        self.assertEqual(updated["title"], "Mgr Updated")

if __name__ == "__main__":
    unittest.main()
