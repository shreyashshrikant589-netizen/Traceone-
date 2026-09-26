import unittest
from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import UUID

from fastapi.testclient import TestClient
from fastapi import HTTPException

from backend.main import app
from backend.schemas.common import UserRole
from backend.schemas.zones import ZoneCreate, ZoneGeometry, ZoneStatus, ZoneStatusUpdate
from backend.security.auth import CurrentUser
from backend.services import zones

PROFILE_ID = UUID("11111111-1111-1111-1111-111111111111")
OTHER_ID = UUID("66666666-6666-6666-6666-666666666666")
CASE_ID = UUID("33333333-3333-3333-3333-333333333333")
OTHER_CASE_ID = UUID("77777777-7777-7777-7777-777777777777")
ZONE_ID = UUID("88888888-8888-8888-8888-888888888888")


def current(role: UserRole = UserRole.VOLUNTEER, profile_id: UUID = PROFILE_ID) -> CurrentUser:
    return CurrentUser(UUID("22222222-2222-2222-2222-222222222222"), {"id": str(profile_id), "role": role, "is_active": True, "is_verified": True})


def case_row(case_id: UUID = CASE_ID) -> dict:
    return {"id": str(case_id), "created_by": str(PROFILE_ID), "case_manager_id": str(PROFILE_ID), "is_public": False}


def zone_row(**updates: object) -> dict:
    row = {"id": str(ZONE_ID), "case_id": str(CASE_ID), "name": "North sector", "description": None, "geometry": {"type": "MultiPolygon", "coordinates": [[[[0, 0], [1, 0], [1, 1], [0, 0]]]]}, "status": "UNSEARCHED", "priority_score": None, "priority_rank": None, "assigned_volunteer_id": None, "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()}
    row.update(updates)
    return row


class FakeDatabase:
    def __init__(self, zone: dict | None = None, members: list[dict] | None = None, volunteer: dict | None = None) -> None:
        self.zone = zone or zone_row()
        self.members = members if members is not None else [{"case_id": str(CASE_ID), "user_id": str(PROFILE_ID), "status": "ACTIVE", "left_at": None}]
        self.volunteer = volunteer or {"id": str(PROFILE_ID), "role": "VOLUNTEER", "is_active": True, "is_verified": True}
        self.created: dict | None = None

    def case_by_id(self, case_id: str) -> dict | None:
        return case_row(CASE_ID) if case_id == str(CASE_ID) else None

    def list_case_memberships_for_user(self, profile_id: str) -> list[dict]:
        return [member for member in self.members if str(member.get("user_id")) == profile_id]

    def zone_by_id(self, case_id: str, zone_id: str) -> dict | None:
        return self.zone if case_id == self.zone["case_id"] and zone_id == self.zone["id"] else None

    def list_zones(self, case_id: str) -> list[dict]:
        return [self.zone] if case_id == self.zone["case_id"] else []

    def create_zone(self, values: dict) -> dict:
        self.created = values
        return {**zone_row(), **values, "id": str(ZONE_ID), "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()}

    def update_zone(self, case_id: str, zone_id: str, values: dict) -> dict:
        self.zone.update(values)
        return self.zone

    def profile_by_id(self, profile_id: str) -> dict | None:
        return self.volunteer if profile_id == str(self.volunteer["id"]) else None


class ZoneTests(unittest.TestCase):
    def test_unauthenticated_creation_is_401(self) -> None:
        response = TestClient(app).post(f"/api/v1/cases/{CASE_ID}/zones", json={"name": "North", "geometry": {"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 0]]]}})
        self.assertEqual(response.status_code, 401)

    def test_volunteer_cannot_create_zone(self) -> None:
        with self.assertRaisesRegex(HTTPException, "cannot create zones"):
            zones.create_zone(FakeDatabase(), current(profile_id=OTHER_ID), CASE_ID, ZoneCreate(name="North", geometry=ZoneGeometry(type="Polygon", coordinates=[[[0, 0], [1, 0], [1, 1], [0, 0]]])))

    def test_manager_creates_zone_and_normalizes_geometry(self) -> None:
        database = FakeDatabase()
        result = zones.create_zone(database, current(UserRole.CASE_MANAGER), CASE_ID, ZoneCreate(name="North", geometry=ZoneGeometry(type="Polygon", coordinates=[[[0, 0], [1, 0], [1, 1], [0, 0]]])))
        self.assertEqual(result["geometry"]["type"], "MultiPolygon")
        self.assertEqual(database.created["status"], "UNSEARCHED")
        self.assertIsNone(database.created["assigned_volunteer_id"])

    def test_list_and_get_require_case_access(self) -> None:
        database = FakeDatabase()
        self.assertEqual(len(zones.list_zones(database, current(), CASE_ID)), 1)
        self.assertEqual(zones.get_zone(database, current(), CASE_ID, ZONE_ID)["id"], str(ZONE_ID))
        with self.assertRaisesRegex(HTTPException, "Case not found"):
            zones.get_zone(database, current(), OTHER_CASE_ID, ZONE_ID)

    def test_manager_assigns_valid_member(self) -> None:
        database = FakeDatabase()
        result = zones.assign_zone(database, current(UserRole.CASE_MANAGER), CASE_ID, ZONE_ID, PROFILE_ID)
        self.assertEqual(result["status"], "ASSIGNED")
        self.assertEqual(result["assigned_volunteer_id"], str(PROFILE_ID))

    def test_assignment_rejects_nonmember_or_ineligible(self) -> None:
        with self.assertRaisesRegex(HTTPException, "active case member"):
            zones.assign_zone(FakeDatabase(members=[], volunteer={"id": str(OTHER_ID), "role": "VOLUNTEER", "is_active": True, "is_verified": True}), current(UserRole.CASE_MANAGER), CASE_ID, ZONE_ID, OTHER_ID)
        with self.assertRaisesRegex(HTTPException, "not eligible"):
            zones.assign_zone(FakeDatabase(volunteer={"id": str(PROFILE_ID), "role": "REPORTER", "is_active": True, "is_verified": True}), current(UserRole.CASE_MANAGER), CASE_ID, ZONE_ID, PROFILE_ID)

    def test_unassign_and_assigned_volunteer_status_update(self) -> None:
        database = FakeDatabase(zone=zone_row(assigned_volunteer_id=str(PROFILE_ID), status="ASSIGNED"))
        self.assertEqual(zones.unassign_zone(database, current(UserRole.CASE_MANAGER), CASE_ID, ZONE_ID)["status"], "UNSEARCHED")
        database = FakeDatabase(zone=zone_row(assigned_volunteer_id=str(PROFILE_ID), status="ASSIGNED"))
        result = zones.update_status(database, current(), CASE_ID, ZONE_ID, ZoneStatusUpdate(status=ZoneStatus.IN_PROGRESS))
        self.assertEqual(result["status"], "IN_PROGRESS")

    def test_unrelated_volunteer_cannot_update_zone(self) -> None:
        UNRELATED_ID = UUID("99999999-9999-9999-9999-999999999999")
        database = FakeDatabase(zone=zone_row(assigned_volunteer_id=str(OTHER_ID)))
        database.members = [{"case_id": str(CASE_ID), "user_id": str(UNRELATED_ID), "status": "ACTIVE", "left_at": None}]
        with self.assertRaisesRegex(HTTPException, "cannot update"):
            zones.update_status(database, current(profile_id=UNRELATED_ID), CASE_ID, ZONE_ID, ZoneStatusUpdate(status=ZoneStatus.SEARCHED))

    def test_my_assignments_filters_by_current_profile(self) -> None:
        database = FakeDatabase(zone=zone_row(assigned_volunteer_id=str(PROFILE_ID)))
        self.assertEqual(len(zones.my_assignments(database, current(), CASE_ID)), 1)
        database.zone["assigned_volunteer_id"] = str(OTHER_ID)
        self.assertEqual(zones.my_assignments(database, current(), CASE_ID), [])


if __name__ == "__main__":
    unittest.main()
