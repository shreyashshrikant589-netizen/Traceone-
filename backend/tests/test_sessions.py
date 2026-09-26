import unittest
from datetime import datetime, timezone
from uuid import UUID

from fastapi.testclient import TestClient
from fastapi import HTTPException

from backend.main import app
from backend.schemas.common import UserRole
from backend.schemas.sessions import PointGeometry, SessionComplete, SessionCreate, SessionStatus
from backend.security.auth import CurrentUser
from backend.services import sessions

PROFILE_ID = UUID("11111111-1111-1111-1111-111111111111")
OTHER_ID = UUID("66666666-6666-6666-6666-666666666666")
CASE_ID = UUID("33333333-3333-3333-3333-333333333333")
ZONE_ID = UUID("88888888-8888-8888-8888-888888888888")
SESSION_ID = UUID("99999999-9999-9999-9999-999999999999")


def current(role: UserRole = UserRole.VOLUNTEER, profile_id: UUID = PROFILE_ID) -> CurrentUser:
    return CurrentUser(UUID("22222222-2222-2222-2222-222222222222"), {"id": str(profile_id), "role": role, "is_active": True, "is_verified": True})


def session_row(**updates: object) -> dict:
    row = {"id": str(SESSION_ID), "case_id": str(CASE_ID), "zone_id": str(ZONE_ID), "volunteer_id": str(PROFILE_ID), "status": "ACTIVE", "started_at": datetime.now(timezone.utc).isoformat(), "ended_at": None, "start_location": None, "end_location": None, "notes": None, "verification_status": "PENDING", "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()}
    row.update(updates)
    return row


class FakeDatabase:
    def __init__(self, session: dict | None = None, zone_status: str = "IN_PROGRESS", sessions: list[dict] | None = None) -> None:
        self.session = session or session_row()
        self.sessions = sessions if sessions is not None else [self.session]
        self.zone = {"id": str(ZONE_ID), "case_id": str(CASE_ID), "status": zone_status, "assigned_volunteer_id": str(PROFILE_ID)}
        self.updated_zone_values: dict | None = None

    def case_by_id(self, case_id: str) -> dict | None:
        return {"id": str(CASE_ID), "created_by": str(PROFILE_ID), "case_manager_id": str(PROFILE_ID), "is_public": False} if case_id == str(CASE_ID) else None

    def list_case_memberships_for_user(self, profile_id: str) -> list[dict]:
        return [{"case_id": str(CASE_ID), "user_id": profile_id, "status": "ACTIVE", "left_at": None}]

    def zone_by_id(self, case_id: str, zone_id: str) -> dict | None:
        return self.zone if case_id == str(CASE_ID) and zone_id == str(ZONE_ID) else None

    def list_sessions(self, case_id: str, zone_id: str | None = None, volunteer_id: str | None = None, session_status: str | None = None) -> list[dict]:
        rows = [row for row in self.sessions if row["case_id"] == case_id]
        if zone_id:
            rows = [row for row in rows if row["zone_id"] == zone_id]
        if volunteer_id:
            rows = [row for row in rows if row["volunteer_id"] == volunteer_id]
        if session_status:
            rows = [row for row in rows if row["status"] == session_status]
        return rows

    def session_by_id(self, case_id: str, session_id: str) -> dict | None:
        return self.session if self.session["case_id"] == case_id and self.session["id"] == session_id else None

    def create_session(self, values: dict) -> dict:
        self.session = {**session_row(), **values}
        self.sessions.append(self.session)
        return self.session

    def update_session(self, session_id: str, values: dict) -> dict:
        self.session.update(values)
        return self.session

    def update_zone(self, case_id: str, zone_id: str, values: dict) -> dict:
        self.zone.update(values)
        self.updated_zone_values = values
        return self.zone

    def count_active_zone_sessions(self, case_id: str, zone_id: str) -> int:
        return sum(1 for row in self.sessions if row["case_id"] == case_id and row["zone_id"] == zone_id and row["status"] in {"ACTIVE", "PAUSED"})


class SessionTests(unittest.TestCase):
    def test_unauthenticated_start_is_401(self) -> None:
        response = TestClient(app).post(f"/api/v1/cases/{CASE_ID}/zones/{ZONE_ID}/search-sessions", json={})
        self.assertEqual(response.status_code, 401)

    def test_start_requires_assignment_for_volunteer(self) -> None:
        database = FakeDatabase()
        database.zone["assigned_volunteer_id"] = str(OTHER_ID)
        with self.assertRaisesRegex(HTTPException, "not assigned"):
            sessions.start_session(database, current(), CASE_ID, ZONE_ID, SessionCreate())

    def test_start_and_duplicate_active_rejected(self) -> None:
        database = FakeDatabase(sessions=[])
        result = sessions.start_session(database, current(), CASE_ID, ZONE_ID, SessionCreate(start_location=PointGeometry(type="Point", coordinates=[10, 20])))
        self.assertEqual(result["status"], "ACTIVE")
        with self.assertRaisesRegex(HTTPException, "active session"):
            sessions.start_session(database, current(), CASE_ID, ZONE_ID, SessionCreate())

    def test_pause_resume_complete_marks_zone_searched(self) -> None:
        database = FakeDatabase()
        sessions.transition(database, current(), CASE_ID, SESSION_ID, SessionStatus.PAUSED)
        sessions.transition(database, current(), CASE_ID, SESSION_ID, SessionStatus.ACTIVE)
        result = sessions.transition(database, current(), CASE_ID, SESSION_ID, SessionStatus.COMPLETED, SessionComplete(end_location=PointGeometry(type="Point", coordinates=[10, 20])))
        self.assertEqual(result["status"], "COMPLETED")
        self.assertEqual(database.updated_zone_values["status"], "SEARCHED")

    def test_cancel_does_not_mark_zone_searched(self) -> None:
        database = FakeDatabase()
        result = sessions.transition(database, current(), CASE_ID, SESSION_ID, SessionStatus.CANCELLED)
        self.assertEqual(result["status"], "CANCELLED")
        self.assertIsNone(database.updated_zone_values)

    def test_owner_and_manager_access(self) -> None:
        database = FakeDatabase()
        self.assertEqual(sessions.get_session(database, current(), CASE_ID, SESSION_ID)["id"], str(SESSION_ID))
        manager = current(UserRole.CASE_MANAGER)
        self.assertEqual(sessions.get_session(database, manager, CASE_ID, SESSION_ID)["id"], str(SESSION_ID))

    def test_my_active_filters_current_user(self) -> None:
        database = FakeDatabase(sessions=[session_row(), session_row(id="other", volunteer_id=str(OTHER_ID), status="PAUSED")])
        result = sessions.list_my_active(database, current(), CASE_ID)
        self.assertEqual({row["volunteer_id"] for row in result}, {str(PROFILE_ID)})


if __name__ == "__main__":
    unittest.main()
