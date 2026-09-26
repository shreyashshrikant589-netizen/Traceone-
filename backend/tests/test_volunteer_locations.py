import unittest
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException
from pydantic import ValidationError

from backend.schemas.common import UserRole
from backend.schemas.volunteer_locations import VolunteerLocationCreate
from backend.security.auth import CurrentUser
from backend.services import volunteer_locations

CASE_ID = UUID("33333333-3333-3333-3333-333333333333")
OTHER_CASE_ID = UUID("44444444-4444-4444-4444-444444444444")
SESSION_ID = UUID("55555555-5555-5555-5555-555555555555")
OTHER_SESSION_ID = UUID("66666666-6666-6666-6666-666666666666")
VOLUNTEER_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
MANAGER_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")


def current(profile_id: UUID = VOLUNTEER_ID, role: UserRole = UserRole.VOLUNTEER, active: bool = True, verified: bool = True) -> CurrentUser:
    return CurrentUser(UUID("cccccccc-cccc-cccc-cccc-cccccccccccc"), {"id": str(profile_id), "role": role, "is_active": active, "is_verified": verified})


def payload(recorded_at: datetime | None = None, **values: object) -> VolunteerLocationCreate:
    return VolunteerLocationCreate(latitude=40.0, longitude=-73.0, recorded_at=recorded_at or datetime.now(timezone.utc) - timedelta(minutes=1), **values)


class FakeDatabase:
    def __init__(self) -> None:
        now = (datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat()
        self.case = {"id": str(CASE_ID), "created_by": str(MANAGER_ID), "case_manager_id": str(MANAGER_ID)}
        self.sessions = {
            str(SESSION_ID): {"id": str(SESSION_ID), "case_id": str(CASE_ID), "volunteer_id": str(VOLUNTEER_ID), "status": "ACTIVE"},
            str(OTHER_SESSION_ID): {"id": str(OTHER_SESSION_ID), "case_id": str(CASE_ID), "volunteer_id": str(MANAGER_ID), "status": "ACTIVE"},
        }
        self.locations = [{"id": "location-1", "case_id": str(CASE_ID), "volunteer_id": str(VOLUNTEER_ID), "session_id": str(SESSION_ID), "location": {"type": "Point", "coordinates": [-73.0, 40.0]}, "accuracy_m": 5, "speed": None, "heading": None, "recorded_at": now, "created_at": now}]

    def case_by_id(self, case_id: str) -> dict | None:
        return self.case if case_id == str(CASE_ID) else None

    def list_case_memberships_for_user(self, profile_id: str) -> list[dict]:
        return [{"case_id": str(CASE_ID), "user_id": profile_id, "status": "ACTIVE", "left_at": None}] if profile_id == str(VOLUNTEER_ID) else []

    def session_by_id(self, case_id: str, session_id: str) -> dict | None:
        session = self.sessions.get(session_id)
        return session if session and session["case_id"] == case_id else None

    def latest_volunteer_location(self, case_id: str, session_id: str, volunteer_id: str) -> dict | None:
        rows = [row for row in self.locations if row["case_id"] == case_id and row["session_id"] == session_id and row["volunteer_id"] == volunteer_id]
        return rows[-1] if rows else None

    def create_volunteer_location(self, values: dict) -> dict:
        row = {"id": f"location-{len(self.locations) + 1}", "created_at": datetime.now(timezone.utc).isoformat(), **values}
        self.locations.append(row)
        return row

    def list_volunteer_locations(self, case_id: str, session_ids=None, volunteer_id=None, since=None, limit=100) -> list[dict]:
        rows = [row for row in self.locations if row["case_id"] == case_id and (session_ids is None or row["session_id"] in session_ids) and (volunteer_id is None or row["volunteer_id"] == volunteer_id)]
        return rows[:limit]

    def list_sessions(self, case_id: str, zone_id=None, volunteer_id=None, session_status=None) -> list[dict]:
        return [row for row in self.sessions.values() if row["case_id"] == case_id and (session_status is None or row["status"] == session_status)]


class VolunteerLocationTests(unittest.TestCase):
    def test_active_verified_owner_can_submit_server_derived_location(self) -> None:
        database = FakeDatabase()
        result = volunteer_locations.submit(database, current(), CASE_ID, SESSION_ID, payload())
        self.assertEqual(result["case_id"], str(CASE_ID))
        self.assertEqual(result["session_id"], str(SESSION_ID))
        self.assertEqual(result["volunteer_id"], str(VOLUNTEER_ID))
        self.assertEqual(result["location"]["coordinates"], [-73.0, 40.0])

    def test_invalid_users_membership_session_and_timestamp_are_rejected(self) -> None:
        database = FakeDatabase()
        for user in (current(active=False), current(verified=False), current(UUID("dddddddd-dddd-dddd-dddd-dddddddddddd"))):
            with self.assertRaises(HTTPException):
                volunteer_locations.submit(database, user, CASE_ID, SESSION_ID, payload())
        with self.assertRaisesRegex(HTTPException, "another volunteer"):
            volunteer_locations.submit(database, current(), CASE_ID, OTHER_SESSION_ID, payload())
        database.sessions[str(SESSION_ID)]["status"] = "PAUSED"
        with self.assertRaisesRegex(HTTPException, "ACTIVE"):
            volunteer_locations.submit(database, current(), CASE_ID, SESSION_ID, payload())
        with self.assertRaises(ValidationError):
            payload(datetime.now(timezone.utc) + timedelta(minutes=10))

    def test_coordinate_quality_and_duplicate_protection(self) -> None:
        with self.assertRaises(ValidationError):
            VolunteerLocationCreate(latitude=91, longitude=0, recorded_at=datetime.now(timezone.utc))
        with self.assertRaises(ValidationError):
            VolunteerLocationCreate(latitude=0, longitude=181, recorded_at=datetime.now(timezone.utc))
        with self.assertRaises(ValidationError):
            VolunteerLocationCreate(latitude=0, longitude=0, accuracy_m=-1, recorded_at=datetime.now(timezone.utc))
        database = FakeDatabase()
        duplicate_time = datetime.fromisoformat(database.locations[0]["recorded_at"])
        with self.assertRaisesRegex(HTTPException, "Duplicate"):
            volunteer_locations.submit(database, current(), CASE_ID, SESSION_ID, payload(duplicate_time))

    def test_latest_and_history_are_session_and_user_scoped(self) -> None:
        database = FakeDatabase()
        self.assertEqual(volunteer_locations.latest(database, current(), CASE_ID, SESSION_ID)["volunteer_id"], str(VOLUNTEER_ID))
        self.assertEqual(len(volunteer_locations.history(database, current(), CASE_ID, SESSION_ID, 1)), 1)
        with self.assertRaisesRegex(HTTPException, "another volunteer"):
            volunteer_locations.history(database, current(), CASE_ID, OTHER_SESSION_ID, 1)
        with self.assertRaises(HTTPException):
            volunteer_locations.history(database, current(), CASE_ID, SESSION_ID, 201)

    def test_manager_can_view_only_active_case_locations(self) -> None:
        database = FakeDatabase()
        results = volunteer_locations.active_locations(database, current(MANAGER_ID, UserRole.CASE_MANAGER), CASE_ID, 15)
        self.assertEqual(len(results), 1)
        database.sessions[str(SESSION_ID)]["status"] = "PAUSED"
        self.assertEqual(volunteer_locations.active_locations(database, current(MANAGER_ID, UserRole.CASE_MANAGER), CASE_ID, 15), [])


if __name__ == "__main__":
    unittest.main()