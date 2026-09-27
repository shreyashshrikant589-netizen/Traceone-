import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
from uuid import UUID

from fastapi.testclient import TestClient

from backend.main import app
from backend.schemas.common import UserRole
from backend.security.auth import CurrentUser
from backend.services import cases as case_service


PROFILE_ID = UUID("11111111-1111-1111-1111-111111111111")
AUTH_USER_ID = UUID("22222222-2222-2222-2222-222222222222")
CASE_ID = UUID("33333333-3333-3333-3333-333333333333")


class ApiSecurityTests(unittest.TestCase):
    def test_profile_requires_bearer_token(self) -> None:
        response = TestClient(app).get("/api/v1/profile/me")
        self.assertEqual(response.status_code, 401)

    @patch("backend.security.auth.get_supabase")
    def test_current_user_resolves_profile(self, get_supabase: MagicMock) -> None:
        client = MagicMock()
        client.auth.get_user.return_value = SimpleNamespace(user=SimpleNamespace(id=str(AUTH_USER_ID)))
        profile_query = MagicMock()
        profile_query.execute.return_value = SimpleNamespace(
            data={
                "id": str(PROFILE_ID),
                "auth_user_id": str(AUTH_USER_ID),
                "full_name": "Test User",
                "phone": None,
                "email": "test@example.com",
                "role": "VOLUNTEER",
                "avatar_url": None,
                "is_active": True,
                "is_verified": True,
                "created_at": "2026-01-01T00:00:00Z",
                "updated_at": "2026-01-01T00:00:00Z",
            },
            error=None,
        )
        client.table.return_value.select.return_value.eq.return_value.single.return_value = profile_query
        get_supabase.return_value = client

        response = TestClient(app).get("/api/v1/profile/me", headers={"Authorization": "Bearer test-token"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], str(PROFILE_ID))
        self.assertEqual(response.json()["role"], "VOLUNTEER")


class CaseAuthorizationTests(unittest.TestCase):
    def test_volunteer_can_create_case(self) -> None:
        user = CurrentUser(
            auth_user_id=AUTH_USER_ID,
            profile={"id": str(PROFILE_ID), "role": UserRole.VOLUNTEER},
        )
        database = MagicMock()
        database.create_case.return_value = {"id": str(CASE_ID), "title": "Test", "created_by": str(PROFILE_ID), "case_manager_id": str(PROFILE_ID)}
        payload = SimpleNamespace(model_dump=lambda exclude_none=True: {"title": "Test"})

        result = case_service.create_case(database, user, payload)
        self.assertEqual(result["created_by"], str(PROFILE_ID))
        self.assertEqual(result["case_manager_id"], str(PROFILE_ID))

    def test_non_member_private_case_is_hidden(self) -> None:
        user = CurrentUser(
            auth_user_id=AUTH_USER_ID,
            profile={"id": str(PROFILE_ID), "role": UserRole.VOLUNTEER},
        )
        database = MagicMock()
        database.case_by_id.return_value = {"id": str(CASE_ID), "is_public": False, "created_by": "44444444-4444-4444-4444-444444444444", "case_manager_id": None}
        database.list_case_memberships_for_user.return_value = []

        with self.assertRaisesRegex(Exception, "Case not found"):
            case_service.get_case(database, user, CASE_ID)


if __name__ == "__main__":
    unittest.main()
