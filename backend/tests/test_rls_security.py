import re
import unittest
from pathlib import Path


SQL_PATH = Path(__file__).parents[1] / "sql" / "001_rls_security_hardening.sql"
PROTECTED_TABLES = {
    "profiles", "cases", "case_members", "case_invites", "zones", "search_sessions",
    "volunteer_locations", "evidence", "witness_reports", "reports", "ai_search_priorities",
    "evidence_graph_nodes", "evidence_graph_edges", "possible_matches", "search_expansions",
    "case_publications", "case_settings", "police_notifications", "notifications", "case_timeline",
    "device_sessions", "sync_queue", "audit_logs",
}


class RLSStaticSecurityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.sql = SQL_PATH.read_text(encoding="utf-8")

    def test_security_sql_exists_and_enables_rls_for_protected_tables(self) -> None:
        self.assertTrue(SQL_PATH.exists())
        enabled = set(re.findall(r"alter table if exists public\.([a-z_]+) enable row level security", self.sql, re.IGNORECASE))
        self.assertEqual(enabled, PROTECTED_TABLES)
        self.assertNotIn("spatial_ref_sys", enabled)

    def test_auth_mapping_and_active_membership_are_explicit(self) -> None:
        self.assertIn("p.auth_user_id = auth.uid()", self.sql)
        self.assertIn("cm.status = 'ACTIVE'", self.sql)
        self.assertIn("cm.left_at is null", self.sql)
        self.assertIn("public.traceone_profile_role() = 'SUPER_ADMIN'", self.sql)

    def test_sensitive_policies_are_not_unrestricted(self) -> None:
        self.assertNotRegex(self.sql, r"USING\s*\(\s*true\s*\)")
        self.assertNotRegex(self.sql, r"WITH\s+CHECK\s*\(\s*true\s*\)")
        for policy in ("notifications_self_select", "device_sessions_self_select", "sync_queue_self_select", "locations_private_select", "police_case_select", "possible_matches_case_select"):
            self.assertIn(f"traceone_{policy}", self.sql)

    def test_audit_logs_have_no_authenticated_user_policy(self) -> None:
        audit_section = self.sql.split("alter table if exists public.audit_logs enable row level security", 1)[1]
        self.assertNotRegex(audit_section, r"create policy .*audit_logs", re.IGNORECASE)
        self.assertIn("RLS therefore denies reads/writes", audit_section)

    def test_trusted_write_policies_are_not_created(self) -> None:
        self.assertNotRegex(self.sql, r"create policy .* for (insert|update|delete|all)", re.IGNORECASE)


if __name__ == "__main__":
    unittest.main()
