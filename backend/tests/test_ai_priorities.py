import unittest
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException

from backend.schemas.common import UserRole
from backend.security.auth import CurrentUser
from backend.services import ai_priorities

CASE_ID = UUID("33333333-3333-3333-3333-333333333333")
ZONE_ONE = UUID("11111111-1111-1111-1111-111111111111")
ZONE_TWO = UUID("22222222-2222-2222-2222-222222222222")
MANAGER_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
VOLUNTEER_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")


def current(role: UserRole, profile_id: UUID = MANAGER_ID, active: bool = True, verified: bool = True) -> CurrentUser:
    return CurrentUser(UUID("cccccccc-cccc-cccc-cccc-cccccccccccc"), {"id": str(profile_id), "role": role, "is_active": active, "is_verified": verified})


def priority_row(values: dict) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    return {"id": str(UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")), "created_at": now, **values}


class FakeDatabase:
    def __init__(self, zones: list[dict] | None = None) -> None:
        self.case = {"id": str(CASE_ID), "created_by": str(MANAGER_ID), "case_manager_id": str(MANAGER_ID), "last_seen_location": {"lat": 0, "lng": 0}, "last_seen_at": datetime.now(timezone.utc).isoformat(), "known_destination": "North exit"}
        self.zones = zones if zones is not None else [
            {"id": str(ZONE_ONE), "case_id": str(CASE_ID), "name": "North exit", "description": "Transit exit", "geometry": {"type": "Point", "coordinates": [0, 0]}, "status": "UNSEARCHED", "priority_score": None, "priority_rank": None},
            {"id": str(ZONE_TWO), "case_id": str(CASE_ID), "name": "South sector", "description": None, "geometry": {"type": "Point", "coordinates": [10, 10]}, "status": "SEARCHED", "priority_score": None, "priority_rank": None},
        ]
        self.evidence = [{"id": "e1", "zone_id": str(ZONE_ONE), "status": "VERIFIED", "created_at": datetime.now(timezone.utc).isoformat(), "confidence": 1.0}]
        self.witnesses = [{"id": "w1", "zone_id": str(ZONE_ONE), "status": "VERIFIED", "reported_at": datetime.now(timezone.utc).isoformat(), "confidence": 1.0, "direction": "NORTH"}, {"id": "w2", "zone_id": str(ZONE_ONE), "status": "REJECTED", "reported_at": datetime.now(timezone.utc).isoformat(), "confidence": 1.0}]
        self.reports = [{"id": "r1", "zone_id": str(ZONE_ONE), "status": "VERIFIED", "created_at": datetime.now(timezone.utc).isoformat()}]
        self.sessions = []
        self.memberships = []
        self.priorities = []
        self.timeline = []
        self.notifications = []

    def case_by_id(self, case_id: str) -> dict | None:
        return self.case if case_id == str(CASE_ID) else None

    def list_case_memberships_for_user(self, profile_id: str) -> list[dict]:
        return [row for row in self.memberships if row["user_id"] == profile_id]

    def list_zones(self, case_id: str) -> list[dict]:
        return self.zones

    def zone_by_id(self, case_id: str, zone_id: str) -> dict | None:
        return next((zone for zone in self.zones if str(zone["id"]) == zone_id and zone["case_id"] == case_id), None)

    def list_evidence(self, case_id: str, *args) -> list[dict]:
        return self.evidence

    def list_witness_reports(self, case_id: str, *args) -> list[dict]:
        return self.witnesses

    def list_reports(self, case_id: str, *args) -> list[dict]:
        return self.reports

    def list_sessions(self, case_id: str, *args) -> list[dict]:
        return self.sessions

    def create_ai_search_priority(self, values: dict) -> dict:
        row = priority_row({"id": str(UUID(int=len(self.priorities) + 1)), **values})
        self.priorities.append(row)
        return row

    def list_ai_search_priorities(self, case_id: str) -> list[dict]:
        return [row for row in self.priorities if row["case_id"] == case_id]

    def latest_ai_search_priority(self, case_id: str, zone_id: str) -> dict | None:
        rows = [row for row in self.priorities if row["case_id"] == case_id and row["zone_id"] == zone_id]
        return rows[-1] if rows else None

    def update_zone(self, case_id: str, zone_id: str, values: dict) -> dict:
        zone = self.zone_by_id(case_id, zone_id)
        zone.update(values)
        return zone

    def create_timeline_event(self, values: dict) -> dict:
        self.timeline.append(values)
        return values

    def create_notification(self, values: dict) -> dict:
        self.notifications.append(values)
        return values

    def list_active_profiles(self, role: str) -> list[dict]:
        return []


class AIPriorityTests(unittest.TestCase):
    def test_manager_recalculates_ranked_historical_priorities(self) -> None:
        database = FakeDatabase()
        results = ai_priorities.recalculate(database, current(UserRole.CASE_MANAGER), CASE_ID)
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]["rank"], 1)
        self.assertEqual(results[0]["zone_id"], str(ZONE_ONE))
        self.assertEqual(results[0]["model_version"], "traceone-baseline-v1")
        self.assertGreaterEqual(results[0]["priority_score"], 0)
        self.assertLessEqual(results[0]["priority_score"], 100)
        self.assertGreaterEqual(results[0]["confidence"], 0)
        self.assertLessEqual(results[0]["confidence"], 1)
        self.assertEqual(len(database.priorities), 2)
        self.assertEqual(database.zones[0]["priority_rank"], 1)
        self.assertEqual(database.timeline[-1]["event_type"], "AI_PRIORITY_UPDATED")

    def test_rejected_evidence_is_not_used_and_high_priority_notifies(self) -> None:
        database = FakeDatabase()
        database.evidence = [{"id": "bad", "zone_id": str(ZONE_ONE), "status": "REJECTED", "confidence": 1.0}]
        database.witnesses = [{"id": "bad", "zone_id": str(ZONE_ONE), "status": "REJECTED", "confidence": 1.0}]
        results = ai_priorities.recalculate(database, current(UserRole.CASE_MANAGER), CASE_ID)
        self.assertEqual(results[0]["witness_score"], 0.5)
        self.assertEqual(database.notifications, [])

    def test_volunteer_member_can_read_but_cannot_recalculate(self) -> None:
        database = FakeDatabase()
        database.memberships = [{"case_id": str(CASE_ID), "user_id": str(VOLUNTEER_ID), "status": "ACTIVE", "left_at": None}]
        with self.assertRaisesRegex(HTTPException, "authorized"):
            ai_priorities.recalculate(database, current(UserRole.VOLUNTEER, VOLUNTEER_ID), CASE_ID)
        ai_priorities.recalculate(database, current(UserRole.CASE_MANAGER), CASE_ID)
        self.assertEqual(len(ai_priorities.list_priorities(database, current(UserRole.VOLUNTEER, VOLUNTEER_ID), CASE_ID)), 2)

    def test_no_zones_and_missing_zone_priority(self) -> None:
        database = FakeDatabase([])
        with self.assertRaisesRegex(HTTPException, "No search zones"):
            ai_priorities.recalculate(database, current(UserRole.CASE_MANAGER), CASE_ID)
        database = FakeDatabase()
        with self.assertRaisesRegex(HTTPException, "not found"):
            ai_priorities.zone_priority(database, current(UserRole.CASE_MANAGER), CASE_ID, ZONE_ONE)

    def test_single_zone_returns_latest_record_and_case_scope_is_enforced(self) -> None:
        database = FakeDatabase()
        ai_priorities.recalculate(database, current(UserRole.CASE_MANAGER), CASE_ID)
        result = ai_priorities.zone_priority(database, current(UserRole.CASE_MANAGER), CASE_ID, ZONE_ONE)
        self.assertEqual(result["zone_id"], str(ZONE_ONE))
        with self.assertRaisesRegex(HTTPException, "not found"):
            ai_priorities.zone_priority(database, current(UserRole.CASE_MANAGER), CASE_ID, UUID("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"))


if __name__ == "__main__":
    unittest.main()