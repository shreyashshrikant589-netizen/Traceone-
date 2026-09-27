import unittest
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException

from backend.schemas.common import UserRole
from backend.security.auth import CurrentUser
from backend.services import dashboard

CASE_ID = UUID("33333333-3333-3333-3333-333333333333")
OTHER_CASE_ID = UUID("44444444-4444-4444-4444-444444444444")
MANAGER_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
VOLUNTEER_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")


def current(role: UserRole, profile_id: UUID = MANAGER_ID, active: bool = True, verified: bool = True) -> CurrentUser:
    return CurrentUser(UUID("cccccccc-cccc-cccc-cccc-cccccccccccc"), {"id": str(profile_id), "role": role, "is_active": active, "is_verified": verified})


class FakeDatabase:
    def __init__(self) -> None:
        now = datetime.now(timezone.utc).isoformat()
        self.case = {"id": str(CASE_ID), "case_number": "T-15", "created_by": str(MANAGER_ID), "case_manager_id": str(MANAGER_ID), "status": "LOCAL_SEARCH", "is_public": False, "current_radius_m": 100, "resolved_at": None, "closed_at": None}
        self.members = [{"id": "m1", "case_id": str(CASE_ID), "user_id": str(VOLUNTEER_ID), "role": "VOLUNTEER", "status": "ACTIVE", "joined_at": now, "left_at": None}]
        self.zones = [{"id": "zone-1", "case_id": str(CASE_ID), "name": "North", "status": "IN_PROGRESS", "assigned_volunteer_id": str(VOLUNTEER_ID), "priority_score": 88, "priority_rank": 1}, {"id": "zone-2", "case_id": str(CASE_ID), "name": "South", "status": "UNSEARCHED", "assigned_volunteer_id": None, "priority_score": 40, "priority_rank": 2}]
        self.sessions = [{"id": "session-1", "case_id": str(CASE_ID), "volunteer_id": str(VOLUNTEER_ID), "zone_id": "zone-1", "status": "ACTIVE"}, {"id": "session-2", "case_id": str(CASE_ID), "volunteer_id": str(VOLUNTEER_ID), "zone_id": "zone-2", "status": "COMPLETED"}]
        self.locations = [{"id": "loc-1", "case_id": str(CASE_ID), "volunteer_id": str(VOLUNTEER_ID), "session_id": "session-1", "location": {"type": "Point", "coordinates": [1, 2]}, "recorded_at": now}]

    def case_by_id(self, case_id: str) -> dict | None:
        return self.case if case_id == str(CASE_ID) else None

    def list_case_members(self, case_id: str) -> list[dict]: return self.members
    def list_zones(self, case_id: str) -> list[dict]: return self.zones
    def list_sessions(self, case_id: str, *args, **kwargs) -> list[dict]: return self.sessions
    def list_evidence(self, case_id: str, *args) -> list[dict]: return [{"id": "e1", "status": "VERIFIED"}]
    def list_witness_reports(self, case_id: str, *args) -> list[dict]: return [{"id": "w1", "status": "PENDING"}]
    def list_reports(self, case_id: str, *args) -> list[dict]: return [{"id": "r1", "status": "PENDING"}]
    def list_possible_matches(self, case_id: str) -> list[dict]: return [{"id": "pm1", "status": "REVIEW_REQUIRED"}]
    def list_police_notifications(self, case_id: str, *args) -> list[dict]: return [{"case_id": str(CASE_ID), "status": "PENDING"}]
    def list_case_publications(self, case_id: str, *args) -> list[dict]: return []
    def list_ai_search_priorities(self, case_id: str) -> list[dict]: return [{"zone_id": "zone-1", "rank": 1, "priority_score": 88}]
    def list_timeline(self, case_id: str, limit: int, offset: int) -> list[dict]: return [{"id": "t1", "event_type": "SEARCH_STARTED"}][:limit]
    def list_volunteer_locations(self, case_id: str, session_ids=None, **kwargs) -> list[dict]: return self.locations if session_ids is None or "session-1" in session_ids else []
    def list_search_expansions(self, case_id: str) -> list[dict]: return [{"id": "ex1", "status": "RECOMMENDED"}]
    def list_evidence_graph_nodes(self, case_id: str) -> list[dict]: return [{"id": "n1"}]
    def list_evidence_graph_edges(self, case_id: str) -> list[dict]: return [{"id": "e1"}]
    def case_settings_by_case_id(self, case_id: str) -> dict: return {"allow_location_sharing": False}


class DashboardTests(unittest.TestCase):
    def test_manager_overview_contains_safe_sections_and_stats(self) -> None:
        data = dashboard.overview(FakeDatabase(), current(UserRole.CASE_MANAGER), CASE_ID)
        self.assertEqual(set(data), {"case", "missing_person", "stats", "search", "intelligence", "safety", "recent_activity"})
        self.assertEqual(data["stats"]["total_zones"], 2)
        self.assertEqual(data["stats"]["active_search_sessions"], 1)
        self.assertEqual(data["stats"]["pending_reports"], 1)
        self.assertEqual(data["search"]["active_volunteer_locations"][0]["id"], "loc-1")
        self.assertNotIn("auth_user_id", data["case"])

    def test_super_admin_can_access_and_unrelated_roles_are_denied(self) -> None:
        database = FakeDatabase()
        self.assertEqual(dashboard.stats(database, current(UserRole.SUPER_ADMIN), CASE_ID)["total_members"], 1)
        for role, profile in ((UserRole.CASE_MANAGER, UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")), (UserRole.VOLUNTEER, VOLUNTEER_ID), (UserRole.REPORTER, VOLUNTEER_ID)):
            with self.assertRaisesRegex(HTTPException, "authorized"):
                dashboard.overview(database, current(role, profile), CASE_ID)

    def test_inactive_unverified_missing_and_cross_case_are_safe(self) -> None:
        database = FakeDatabase()
        with self.assertRaisesRegex(HTTPException, "Active verified"):
            dashboard.overview(database, current(UserRole.CASE_MANAGER, active=False), CASE_ID)
        with self.assertRaisesRegex(HTTPException, "Active verified"):
            dashboard.overview(database, current(UserRole.CASE_MANAGER, verified=False), CASE_ID)
        with self.assertRaisesRegex(HTTPException, "not found"):
            dashboard.overview(database, current(UserRole.CASE_MANAGER), OTHER_CASE_ID)

    def test_live_search_and_volunteers_are_bounded_manager_views(self) -> None:
        database = FakeDatabase()
        live = dashboard.live_search(database, current(UserRole.CASE_MANAGER), CASE_ID)
        self.assertEqual(len(live["latest_volunteer_locations"]), 1)
        volunteers = dashboard.volunteers(database, current(UserRole.CASE_MANAGER), CASE_ID)
        self.assertEqual(volunteers[0]["user_id"], str(VOLUNTEER_ID))
        self.assertNotIn("email", volunteers[0])
        with self.assertRaisesRegex(HTTPException, "between 1 and 100"):
            dashboard.activity(database, current(UserRole.CASE_MANAGER), CASE_ID, 101)

    def test_intelligence_and_control_are_read_only_summaries(self) -> None:
        database = FakeDatabase()
        intelligence = dashboard.intelligence(database, current(UserRole.CASE_MANAGER), CASE_ID)
        self.assertEqual(intelligence["top_priority_zones"][0]["zone_id"], "zone-1")
        control = dashboard.control(database, current(UserRole.CASE_MANAGER), CASE_ID)
        self.assertEqual(control["current_radius_m"], 100)
        self.assertEqual(control["latest_expansion"]["status"], "RECOMMENDED")


if __name__ == "__main__":
    unittest.main()