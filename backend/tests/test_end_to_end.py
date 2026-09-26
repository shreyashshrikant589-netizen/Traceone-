import re
import unittest
from pathlib import Path
from uuid import UUID

from backend.main import app
from backend.schemas.common import CaseStatus, UserRole
from backend.schemas.notifications import NotificationType
from backend.schemas.timeline import TimelineEventType
from backend.security.auth import CurrentUser
from backend.services import dashboard
from backend.tests.test_dashboard import FakeDatabase

CASE_ID = UUID("33333333-3333-3333-3333-333333333333")
OTHER_CASE_ID = UUID("44444444-4444-4444-4444-444444444444")
MANAGER_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")


class EndToEndIntegrationTests(unittest.TestCase):
    def test_expected_workflow_routes_are_registered_once(self) -> None:
        paths = app.openapi()["paths"]
        expected = {
            "/api/v1/cases": {"post"},
            "/api/v1/cases/{case_id}/members": {"get"},
            "/api/v1/cases/{case_id}/zones": {"post", "get"},
            "/api/v1/cases/{case_id}/zones/{zone_id}/search-sessions": {"post"},
            "/api/v1/cases/{case_id}/search-sessions/{session_id}/location": {"post"},
            "/api/v1/cases/{case_id}/reports": {"post"},
            "/api/v1/cases/{case_id}/ai/search-priorities/recalculate": {"post"},
            "/api/v1/cases/{case_id}/evidence-graph/rebuild": {"post"},
            "/api/v1/cases/{case_id}/possible-matches": {"post"},
            "/api/v1/cases/{case_id}/ai/search-expansion/recommend": {"post"},
            "/api/v1/cases/{case_id}/public-escalation/request": {"post"},
            "/api/v1/cases/{case_id}/police-notification/request": {"post"},
            "/api/v1/cases/{case_id}/dashboard": {"get"},
            "/api/v1/sync/queue": {"post"},
        }
        for path, methods in expected.items():
            self.assertIn(path, paths, path)
            self.assertTrue(methods.issubset(paths[path]), path)
        self.assertEqual(len(paths), len(set(paths)))

    def test_sensitive_workflow_routes_advertise_authentication(self) -> None:
        paths = app.openapi()["paths"]
        sensitive = [path for path in paths if "/public/cases" not in path and ("/cases/" in path or path.startswith("/api/v1/sync"))]
        for path in sensitive:
            for operation in paths[path].values():
                if isinstance(operation, dict):
                    self.assertTrue(operation.get("security"), path)

    def test_dashboard_chain_and_cross_case_idor(self) -> None:
        database = FakeDatabase()
        manager = CurrentUser(UUID("cccccccc-cccc-cccc-cccc-cccccccccccc"), {"id": str(MANAGER_ID), "role": UserRole.CASE_MANAGER, "is_active": True, "is_verified": True})
        overview = dashboard.overview(database, manager, CASE_ID)
        self.assertEqual(overview["stats"]["total_zones"], 2)
        self.assertTrue(overview["intelligence"]["ai_priorities"])
        self.assertTrue(overview["search"]["active_volunteer_locations"])
        with self.assertRaisesRegex(Exception, "not found"):
            dashboard.overview(database, manager, OTHER_CASE_ID)

    def test_lifecycle_and_safety_contracts_remain_explicit(self) -> None:
        self.assertEqual(CaseStatus.LOCAL_SEARCH.value, "LOCAL_SEARCH")
        self.assertEqual(CaseStatus.PUBLIC_ESCALATION_PENDING.value, "PUBLIC_ESCALATION_PENDING")
        self.assertEqual(CaseStatus.PUBLIC_SEARCH.value, "PUBLIC_SEARCH")
        self.assertEqual(TimelineEventType.AI_PRIORITY_UPDATED.value, "AI_PRIORITY_UPDATED")
        self.assertEqual(TimelineEventType.POSSIBLE_MATCH.value, "POSSIBLE_MATCH")
        self.assertEqual(TimelineEventType.POLICE_NOTIFIED.value, "POLICE_NOTIFIED")
        self.assertEqual(NotificationType.POSSIBLE_MATCH.value, "POSSIBLE_MATCH")
        self.assertEqual(NotificationType.SEARCH_EXPANSION.value, "SEARCH_EXPANSION")

    def test_ai_and_privileged_actions_do_not_encode_automatic_resolution(self) -> None:
        service_files = [
            "ai_priorities.py", "evidence_graph.py", "search_expansions.py",
            "possible_matches.py", "police_notifications.py",
        ]
        root = Path(__file__).parents[1] / "services"
        for filename in service_files:
            source = (root / filename).read_text(encoding="utf-8")
            self.assertNotRegex(source, r"update_case\([^\n]+status[^\n]+(RESOLVED|CLOSED)")
        sql = (Path(__file__).parents[1] / "sql" / "001_rls_security_hardening.sql").read_text(encoding="utf-8")
        self.assertNotRegex(sql, r"USING\s*\(\s*true\s*\)")
        self.assertIn("p.auth_user_id = auth.uid()", sql)


if __name__ == "__main__":
    unittest.main()
