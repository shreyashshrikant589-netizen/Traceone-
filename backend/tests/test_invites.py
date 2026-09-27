import hashlib
import unittest
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from uuid import UUID

from fastapi.testclient import TestClient
from fastapi import HTTPException

from backend.main import app
from backend.schemas.common import UserRole
from backend.schemas.invites import InviteCreate, JoinCredential
from backend.security.auth import CurrentUser
from backend.services import invites


PROFILE_ID = UUID("11111111-1111-1111-1111-111111111111")
AUTH_USER_ID = UUID("22222222-2222-2222-2222-222222222222")
CASE_ID = UUID("33333333-3333-3333-3333-333333333333")
MEMBERSHIP_ID = UUID("44444444-4444-4444-4444-444444444444")
INVITE_ID = UUID("55555555-5555-5555-5555-555555555555")


def user(role: UserRole = UserRole.VOLUNTEER, verified: bool = True) -> CurrentUser:
    return CurrentUser(
        auth_user_id=AUTH_USER_ID,
        profile={"id": str(PROFILE_ID), "role": role, "is_active": True, "is_verified": verified},
    )


def case() -> dict:
    return {
        "id": str(CASE_ID),
        "case_number": "TO-1001",
        "created_by": str(PROFILE_ID),
        "case_manager_id": str(PROFILE_ID),
        "title": "Community search",
        "status": "ACTIVE",
        "event_name": "Festival",
        "venue_name": "Civic Hall",
        "is_public": False,
    }


def invite(join_code: str = "123456", **overrides: object) -> dict:
    value = {
        "id": str(INVITE_ID),
        "case_id": str(CASE_ID),
        "created_by": str(PROFILE_ID),
        "invite_token_hash": hashlib.sha256(b"token").hexdigest(),
        "join_code_hash": hashlib.sha256(join_code.encode()).hexdigest(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
        "max_uses": 1,
        "used_count": 0,
        "is_active": True,
    }
    value.update(overrides)
    return value


class FakeDatabase:
    def __init__(self, invite_row: dict | None = None, membership: dict | None = None) -> None:
        self.invite_row = invite_row
        self.membership = membership
        self.consumed = False
        self.created_values: dict | None = None

    def case_by_id(self, case_id: str) -> dict | None:
        return case() if case_id == str(CASE_ID) else None

    def create_case_invite(self, values: dict) -> dict:
        self.created_values = values
        return {"id": str(INVITE_ID), "case_id": str(CASE_ID), "expires_at": values["expires_at"], "max_uses": values["max_uses"]}

    def invite_by_join_code_hash(self, value: str) -> dict | None:
        return self.invite_row if self.invite_row and self.invite_row["join_code_hash"] == value else None

    def invite_by_token_hash(self, value: str) -> dict | None:
        return self.invite_row if self.invite_row and self.invite_row["invite_token_hash"] == value else None

    def consume_case_invite(self, value: dict) -> dict | None:
        if self.consumed:
            return None
        self.consumed = True
        return value

    def membership_for_case_user(self, case_id: str, user_id: str) -> dict | None:
        return self.membership

    def create_membership(self, values: dict) -> dict:
        return {"id": str(MEMBERSHIP_ID), **values}

    def reactivate_membership(self, membership_id: str, joined_at: str) -> dict:
        return {"id": membership_id, "case_id": str(CASE_ID), "user_id": str(PROFILE_ID), "role": "VOLUNTEER", "status": "ACTIVE", "joined_at": joined_at}

    def leave_membership(self, membership_id: str, left_at: str) -> dict:
        return {"id": membership_id, "case_id": str(CASE_ID), "user_id": str(PROFILE_ID), "role": "VOLUNTEER", "status": "LEFT", "joined_at": "2026-01-01T00:00:00+00:00"}


class InviteTests(unittest.TestCase):
    def test_unauthenticated_invite_creation_is_401(self) -> None:
        response = TestClient(app).post(f"/api/v1/cases/{CASE_ID}/invites", json={"expires_at": "2030-01-01T00:00:00Z"})
        self.assertEqual(response.status_code, 401)

    def test_manager_creates_invite_without_exposing_hashes(self) -> None:
        database = FakeDatabase()
        result = invites.create_invite(database, user(UserRole.CASE_MANAGER), CASE_ID, InviteCreate(expires_at=datetime.now(timezone.utc) + timedelta(hours=1)))
        self.assertIn("invite_token", result)
        self.assertIn("join_code", result)
        self.assertNotIn("invite_token_hash", result)
        self.assertNotIn("join_code_hash", result)
        self.assertEqual(len(result["join_code"]), 6)
        self.assertIsNotNone(database.created_values["invite_token_hash"])

    def test_volunteer_cannot_create_invite(self) -> None:
        OTHER_PROFILE_ID = UUID("66666666-6666-6666-6666-666666666666")
        other_volunteer = CurrentUser(
            auth_user_id=AUTH_USER_ID,
            profile={"id": str(OTHER_PROFILE_ID), "role": UserRole.VOLUNTEER, "is_active": True, "is_verified": True},
        )
        with self.assertRaisesRegex(HTTPException, "cannot manage invites"):
            invites.create_invite(FakeDatabase(), other_volunteer, CASE_ID, InviteCreate(expires_at=datetime.now(timezone.utc) + timedelta(hours=1)))

    def test_valid_preview(self) -> None:
        result = invites.preview_invite(FakeDatabase(invite("123456")), user(), CASE_ID, JoinCredential(join_code="123456"))
        self.assertEqual(result["case"]["id"], str(CASE_ID))

    def test_valid_resolve(self) -> None:
        result = invites.resolve_invite(FakeDatabase(invite("123456")), user(), JoinCredential(join_code="123456"))
        self.assertEqual(result["case"]["id"], str(CASE_ID))
        self.assertEqual(result["invite"]["join_code_hash"], hashlib.sha256(b"123456").hexdigest())


    def test_invalid_expired_and_inactive_invites(self) -> None:
        with self.assertRaisesRegex(HTTPException, "Invite not found"):
            invites.preview_invite(FakeDatabase(invite("123456")), user(), CASE_ID, JoinCredential(join_code="999999"))
        with self.assertRaisesRegex(HTTPException, "expired"):
            invites.preview_invite(FakeDatabase(invite("123456", expires_at=(datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat())), user(), CASE_ID, JoinCredential(join_code="123456"))
        with self.assertRaisesRegex(HTTPException, "inactive"):
            invites.preview_invite(FakeDatabase(invite("123456", is_active=False)), user(), CASE_ID, JoinCredential(join_code="123456"))

    def test_successful_join(self) -> None:
        result = invites.join_case(FakeDatabase(invite("123456")), user(), CASE_ID, JoinCredential(join_code="123456"))
        self.assertEqual(result["status"], "ACTIVE")

    def test_duplicate_active_membership(self) -> None:
        membership = {"id": str(MEMBERSHIP_ID), "status": "ACTIVE", "left_at": None}
        with self.assertRaisesRegex(HTTPException, "already an active member"):
            invites.join_case(FakeDatabase(invite("123456"), membership), user(), CASE_ID, JoinCredential(join_code="123456"))

    def test_leave_case(self) -> None:
        membership = {"id": str(MEMBERSHIP_ID), "status": "ACTIVE", "left_at": None}
        result = invites.leave_case(FakeDatabase(membership=membership), user(), CASE_ID)
        self.assertEqual(result["status"], "LEFT")

    def test_removed_membership_can_be_reactivated(self) -> None:
        membership = {"id": str(MEMBERSHIP_ID), "status": "REMOVED", "left_at": "2026-01-01T00:00:00+00:00"}
        result = invites.join_case(FakeDatabase(invite("123456"), membership), user(), CASE_ID, JoinCredential(join_code="123456"))
        self.assertEqual(result["status"], "ACTIVE")


if __name__ == "__main__":
    unittest.main()
