import unittest
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException

from backend.schemas.common import UserRole
from backend.security.auth import CurrentUser
from backend.services import evidence_graph

CASE_ID = UUID("33333333-3333-3333-3333-333333333333")
ZONE_ID = UUID("11111111-1111-1111-1111-111111111111")
MANAGER_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
VOLUNTEER_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")


def current(role: UserRole, profile_id: UUID = MANAGER_ID, active: bool = True, verified: bool = True) -> CurrentUser:
    return CurrentUser(UUID("cccccccc-cccc-cccc-cccc-cccccccccccc"), {"id": str(profile_id), "role": role, "is_active": active, "is_verified": verified})


class FakeDatabase:
    def __init__(self) -> None:
        now = datetime.now(timezone.utc).isoformat()
        self.case = {"id": str(CASE_ID), "created_by": str(MANAGER_ID), "case_manager_id": str(MANAGER_ID), "last_seen_location": {"lat": 1, "lng": 1}, "last_seen_at": now}
        self.zone = {"id": str(ZONE_ID), "case_id": str(CASE_ID), "name": "East zone", "geometry": {"type": "Point", "coordinates": [1, 1]}}
        self.evidence = [{"id": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee", "evidence_type": "SIGHTING", "status": "VERIFIED", "location": {"lat": 1, "lng": 1}, "occurred_at": now, "description": "Verified sighting", "confidence": 0.8}, {"id": "ffffffff-ffff-ffff-ffff-ffffffffffff", "evidence_type": "SIGHTING", "status": "REJECTED", "location": {"lat": 1, "lng": 1}, "occurred_at": now, "description": "Rejected sighting", "confidence": 1.0}]
        self.witnesses = [{"id": "11111111-2222-3333-4444-555555555555", "status": "VERIFIED", "location": {"lat": 1, "lng": 1}, "reported_at": now, "description": "Witness report", "confidence": 0.9, "direction": "EAST"}, {"id": "22222222-3333-4444-5555-666666666666", "status": "REJECTED", "location": {"lat": 1, "lng": 1}, "reported_at": now, "description": "Rejected witness", "confidence": 1.0}]
        self.reports = []
        self.sessions = []
        self.memberships = []
        self.nodes = []
        self.edges = []
        self.timeline = []

    def case_by_id(self, case_id: str) -> dict | None:
        return self.case if case_id == str(CASE_ID) else None

    def list_case_memberships_for_user(self, profile_id: str) -> list[dict]:
        return [row for row in self.memberships if row["user_id"] == profile_id]

    def list_evidence(self, case_id: str, *args) -> list[dict]:
        return self.evidence

    def list_witness_reports(self, case_id: str, *args) -> list[dict]:
        return self.witnesses

    def list_reports(self, case_id: str, *args) -> list[dict]:
        return self.reports

    def list_sessions(self, case_id: str, *args) -> list[dict]:
        return self.sessions

    def list_evidence_graph_nodes(self, case_id: str) -> list[dict]:
        return list(self.nodes)

    def create_evidence_graph_node(self, values: dict) -> dict:
        identifier = UUID(int=len(self.nodes) + 1)
        row = {"id": str(identifier), "created_at": datetime.now(timezone.utc).isoformat(), **values}
        self.nodes.append(row)
        return row

    def list_evidence_graph_edges(self, case_id: str) -> list[dict]:
        return list(self.edges)

    def create_evidence_graph_edge(self, values: dict) -> dict:
        identifier = UUID(int=100 + len(self.edges) + 1)
        row = {"id": str(identifier), "created_at": datetime.now(timezone.utc).isoformat(), **values}
        self.edges.append(row)
        return row

    def create_timeline_event(self, values: dict) -> dict:
        self.timeline.append(values)
        return values

    def zone_by_id(self, case_id: str, zone_id: str) -> dict | None:
        return self.zone if case_id == str(CASE_ID) and zone_id == str(ZONE_ID) else None

    def latest_ai_search_priority(self, case_id: str, zone_id: str) -> dict | None:
        return {"zone_id": zone_id, "priority_score": 82.0, "confidence": 0.8, "model_version": "traceone-baseline-v1", "distance_score": 0.8, "witness_score": 0.9, "direction_score": 0.75, "coverage_score": 0.9, "explanation": "High priority."}


class EvidenceGraphTests(unittest.TestCase):
    def test_manager_rebuilds_real_nodes_and_edges(self) -> None:
        database = FakeDatabase()
        result = evidence_graph.rebuild(database, current(UserRole.CASE_MANAGER), CASE_ID)
        node_types = {node["node_type"] for node in result["nodes"]}
        references = {node.get("reference_id") for node in result["nodes"]}
        self.assertIn("LAST_SEEN", node_types)
        self.assertIn("SIGHTING", node_types)
        self.assertIn("WITNESS", node_types)
        self.assertIn("DIRECTION", node_types)
        self.assertIn("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee", references)
        self.assertNotIn("ffffffff-ffff-ffff-ffff-ffffffffffff", references)
        self.assertTrue(result["edges"])
        self.assertTrue(all(0 <= edge["weight"] <= 1 and 0 <= edge["confidence"] <= 1 for edge in result["edges"]))
        self.assertEqual(database.timeline[-1]["event_type"], "AI_PRIORITY_UPDATED")

    def test_rebuild_is_idempotent_for_source_nodes_and_edges(self) -> None:
        database = FakeDatabase()
        first = evidence_graph.rebuild(database, current(UserRole.CASE_MANAGER), CASE_ID)
        node_count, edge_count = len(database.nodes), len(database.edges)
        second = evidence_graph.rebuild(database, current(UserRole.CASE_MANAGER), CASE_ID)
        self.assertEqual(len(database.nodes), node_count)
        self.assertEqual(len(database.edges), edge_count)
        self.assertEqual(len(first["nodes"]), len(second["nodes"]))

    def test_volunteer_member_can_view_but_cannot_rebuild(self) -> None:
        database = FakeDatabase()
        database.memberships = [{"case_id": str(CASE_ID), "user_id": str(VOLUNTEER_ID), "status": "ACTIVE", "left_at": None}]
        with self.assertRaisesRegex(HTTPException, "authorized"):
            evidence_graph.rebuild(database, current(UserRole.VOLUNTEER, VOLUNTEER_ID), CASE_ID)
        result = evidence_graph.graph(database, current(UserRole.VOLUNTEER, VOLUNTEER_ID), CASE_ID)
        self.assertEqual(result["nodes"], [])

    def test_inactive_and_unverified_users_are_rejected(self) -> None:
        database = FakeDatabase()
        with self.assertRaisesRegex(HTTPException, "Active verified"):
            evidence_graph.rebuild(database, current(UserRole.CASE_MANAGER, active=False), CASE_ID)
        with self.assertRaisesRegex(HTTPException, "Active verified"):
            evidence_graph.rebuild(database, current(UserRole.CASE_MANAGER, verified=False), CASE_ID)

    def test_node_idor_and_explanation(self) -> None:
        database = FakeDatabase()
        evidence_graph.rebuild(database, current(UserRole.CASE_MANAGER), CASE_ID)
        node_id = UUID(str(database.nodes[0]["id"]))
        detail = evidence_graph.node(database, current(UserRole.CASE_MANAGER), CASE_ID, node_id)
        self.assertIn("connected_edges", detail)
        explanation = evidence_graph.explanation(database, current(UserRole.CASE_MANAGER), CASE_ID, ZONE_ID)
        self.assertEqual(explanation["zone_id"], str(ZONE_ID))
        self.assertTrue(explanation["supporting_evidence"])
        with self.assertRaisesRegex(HTTPException, "not found"):
            evidence_graph.node(database, current(UserRole.CASE_MANAGER), CASE_ID, UUID("99999999-9999-9999-9999-999999999999"))


if __name__ == "__main__":
    unittest.main()