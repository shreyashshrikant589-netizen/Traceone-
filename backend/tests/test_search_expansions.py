import unittest
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException

from backend.schemas.common import UserRole
from backend.security.auth import CurrentUser
from backend.services import search_expansions

CASE_ID = UUID("33333333-3333-3333-3333-333333333333")
OTHER_CASE_ID = UUID("44444444-4444-4444-4444-444444444444")
EXPANSION_ID = UUID("55555555-5555-5555-5555-555555555555")
MANAGER_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
VOLUNTEER_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")


def current(role: UserRole, profile_id: UUID = MANAGER_ID, active: bool = True, verified: bool = True) -> CurrentUser:
    return CurrentUser(UUID("cccccccc-cccc-cccc-cccc-cccccccccccc"), {"id": str(profile_id), "role": role, "is_active": active, "is_verified": verified})


class FakeDatabase:
    def __init__(self) -> None:
        now = datetime.now(timezone.utc).isoformat()
        self.case = {"id": str(CASE_ID), "created_by": str(MANAGER_ID), "case_manager_id": str(MANAGER_ID), "initial_radius_m": 100.0, "current_radius_m": 100.0, "status": "LOCAL_SEARCH"}
        self.zones = [{"id": "zone-1", "status": "SEARCHED"}, {"id": "zone-2", "status": "UNSEARCHED"}]
        self.sessions = [{"zone_id": "zone-1", "status": "COMPLETED"}]
        self.priorities = [{"zone_id": "zone-2", "priority_score": 90.0, "rank": 1, "confidence": 0.8}]
        self.witnesses = [{"status": "VERIFIED", "direction": "EAST"}]
        self.evidence = [{"status": "VERIFIED", "evidence_type": "EXIT"}, {"status": "REJECTED", "evidence_type": "EXIT"}]
        self.graph_nodes = [{"node_type": "EXIT", "confidence": 0.8}]
        self.history = []
        self.timeline = []
        self.notifications = []
        self.now = now

    def case_by_id(self, case_id: str) -> dict | None:
        return self.case if case_id == str(CASE_ID) else None

    def list_case_memberships_for_user(self, profile_id: str) -> list[dict]:
        return [{"case_id": str(CASE_ID), "user_id": profile_id, "status": "ACTIVE", "left_at": None}]

    def list_search_expansions(self, case_id: str) -> list[dict]:
        return [row for row in self.history if row["case_id"] == case_id]

    def create_search_expansion(self, values: dict) -> dict:
        row = {"id": str(EXPANSION_ID), "created_at": self.now, **values}
        self.history.append(row)
        return row

    def search_expansion_by_id(self, case_id: str, expansion_id: str) -> dict | None:
        return next((row for row in self.history if row["case_id"] == case_id and row["id"] == expansion_id), None)

    def update_search_expansion(self, case_id: str, expansion_id: str, values: dict) -> dict:
        row = self.search_expansion_by_id(case_id, expansion_id)
        row.update(values)
        return row

    def list_zones(self, case_id: str) -> list[dict]:
        return self.zones

    def list_ai_search_priorities(self, case_id: str) -> list[dict]:
        return self.priorities

    def list_sessions(self, case_id: str, *args) -> list[dict]:
        return self.sessions

    def list_witness_reports(self, case_id: str) -> list[dict]:
        return self.witnesses

    def list_evidence(self, case_id: str) -> list[dict]:
        return self.evidence

    def list_evidence_graph_nodes(self, case_id: str) -> list[dict]:
        return self.graph_nodes

    def update_case(self, case_id: str, values: dict) -> dict:
        self.case.update(values)
        return self.case

    def create_timeline_event(self, values: dict) -> dict:
        self.timeline.append(values)
        return values

    def create_notification(self, values: dict) -> dict:
        self.notifications.append(values)
        return values

    def list_case_members(self, case_id: str) -> list[dict]:
        return []


class SearchExpansionTests(unittest.TestCase):
    def test_manager_recommends_from_priority_direction_and_exit_signals(self) -> None:
        database = FakeDatabase()
        result = search_expansions.recommend(database, current(UserRole.CASE_MANAGER), CASE_ID)
        self.assertEqual(result["status"], "RECOMMENDED")
        self.assertEqual(result["recommended_by"], str(MANAGER_ID))
        self.assertEqual(result["stage"], "EVENT_AREA")
        self.assertIn("accepted witness", result["reason"])
        self.assertIn("exit", result["reason"])
        self.assertTrue(database.timeline)
        self.assertTrue(database.notifications)

    def test_volunteer_cannot_recommend_but_can_view(self) -> None:
        database = FakeDatabase()
        with self.assertRaisesRegex(HTTPException, "authorized"):
            search_expansions.recommend(database, current(UserRole.VOLUNTEER, VOLUNTEER_ID), CASE_ID)
        search_expansions.recommend(database, current(UserRole.CASE_MANAGER), CASE_ID)
        self.assertEqual(len(search_expansions.list_expansions(database, current(UserRole.VOLUNTEER, VOLUNTEER_ID), CASE_ID)), 1)

    def test_inactive_unverified_and_case_idor_are_rejected(self) -> None:
        database = FakeDatabase()
        with self.assertRaises(HTTPException):
            search_expansions.recommend(database, current(UserRole.CASE_MANAGER, active=False), CASE_ID)
        with self.assertRaises(HTTPException):
            search_expansions.recommend(database, current(UserRole.CASE_MANAGER, verified=False), CASE_ID)
        with self.assertRaisesRegex(HTTPException, "not found"):
            search_expansions.recommend(database, current(UserRole.CASE_MANAGER), OTHER_CASE_ID)

    def test_duplicate_recommendation_and_progression(self) -> None:
        database = FakeDatabase()
        result = search_expansions.recommend(database, current(UserRole.CASE_MANAGER), CASE_ID)
        with self.assertRaisesRegex(HTTPException, "already exists"):
            search_expansions.recommend(database, current(UserRole.CASE_MANAGER), CASE_ID)
        approved = search_expansions.approve(database, current(UserRole.CASE_MANAGER), CASE_ID, EXPANSION_ID)
        self.assertEqual(approved["status"], "APPROVED")
        self.assertEqual(approved["approved_by"], str(MANAGER_ID))
        with self.assertRaisesRegex(HTTPException, "Cannot change"):
            search_expansions.complete(database, current(UserRole.CASE_MANAGER), CASE_ID, EXPANSION_ID)
        active = search_expansions.activate(database, current(UserRole.CASE_MANAGER), CASE_ID, EXPANSION_ID)
        self.assertEqual(active["status"], "ACTIVE")
        self.assertEqual(database.case["current_radius_m"], active["new_radius_m"])
        completed = search_expansions.complete(database, current(UserRole.CASE_MANAGER), CASE_ID, EXPANSION_ID)
        self.assertEqual(completed["status"], "COMPLETED")
        self.assertEqual(database.case["status"], "LOCAL_SEARCH")

    def test_rejection_and_invalid_lifecycle_are_safe(self) -> None:
        database = FakeDatabase()
        search_expansions.recommend(database, current(UserRole.CASE_MANAGER), CASE_ID)
        rejected = search_expansions.reject(database, current(UserRole.CASE_MANAGER), CASE_ID, EXPANSION_ID)
        self.assertEqual(rejected["status"], "REJECTED")
        with self.assertRaisesRegex(HTTPException, "Cannot change"):
            search_expansions.activate(database, current(UserRole.CASE_MANAGER), CASE_ID, EXPANSION_ID)


if __name__ == "__main__":
    unittest.main()