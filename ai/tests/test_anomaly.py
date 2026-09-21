import unittest
from datetime import datetime, timedelta

from ai.anomaly import (
    ReviewAction,
    RiskLevel,
    SuspiciousReportInput,
    calculate_text_similarity,
    detect_duplicate_report,
    suspicious_report_score,
    suspicious_result_to_evidence,
)
from ai.graph.model import EvidenceStatus


class TestSuspiciousReportDetection(unittest.TestCase):
    def make_report(self, **overrides):
        values = {
            "report_id": "report-1",
            "case_id": "case-1",
            "reporter_id": "reporter-1",
            "text": "I saw a child near the main gate.",
            "source": "synthetic-witness",
            "reported_at": datetime(2026, 9, 20, 10, 0),
            "evidence_ids": ["evidence-1"],
            "attachment_hashes": [],
            "previous_report_count": 0,
            "previous_flagged_report_count": 0,
            "corroborating_report_count": 0,
            "metadata": {},
        }
        values.update(overrides)
        return SuspiciousReportInput(**values)

    def test_clean_report_is_low_risk(self):
        result = suspicious_report_score(self.make_report())
        self.assertEqual(result.risk_level, RiskLevel.LOW)
        self.assertFalse(result.review_recommended)
        self.assertEqual(result.action, ReviewAction.NONE)

    def test_duplicate_text_detection(self):
        previous = self.make_report(report_id="report-old")
        duplicate = self.make_report()
        result = detect_duplicate_report(duplicate, [previous])
        self.assertTrue(result.duplicate_detected)
        self.assertIn("DUPLICATE_TEXT", result.flags)
        self.assertIn("report-old", result.matched_report_ids)

    def test_duplicate_attachment_hash_detection(self):
        previous = self.make_report(report_id="report-old", attachment_hashes=["hash-a"])
        current = self.make_report(attachment_hashes=["hash-a"], text="A different synthetic observation.")
        result = detect_duplicate_report(current, [previous])
        self.assertIn("DUPLICATE_ATTACHMENT", result.flags)

    def test_text_similarity_is_deterministic(self):
        self.assertEqual(calculate_text_similarity("A child near gate", "a child near gate"), 1.0)

    def test_invalid_latitude(self):
        result = suspicious_report_score(self.make_report(latitude=91.0, longitude=18.0))
        self.assertIn("INVALID_LATITUDE", result.flags)
        self.assertTrue(result.review_recommended)

    def test_invalid_longitude(self):
        result = suspicious_report_score(self.make_report(latitude=18.0, longitude=181.0))
        self.assertIn("INVALID_LONGITUDE", result.flags)

    def test_future_timestamp(self):
        result = suspicious_report_score(self.make_report(reported_at=datetime(2030, 1, 1)))
        self.assertIn("FUTURE_TIMESTAMP", result.flags)

    def test_repeated_flagged_reporter_history(self):
        result = suspicious_report_score(self.make_report(previous_flagged_report_count=2))
        self.assertIn("REPEATED_FLAGGED_REPORTER", result.flags)
        self.assertEqual(result.action, ReviewAction.REVIEW)

    def test_low_corroboration_alone_does_not_make_report_fake(self):
        result = suspicious_report_score(self.make_report(corroborating_report_count=0))
        self.assertEqual(result.risk_level, RiskLevel.LOW)
        self.assertNotIn("LOW_CORROBORATION", result.flags)

    def test_corroborating_reports_reduce_suspiciousness(self):
        suspicious = self.make_report(previous_flagged_report_count=2)
        unsupported_score = suspicious_report_score(suspicious)
        supported_score = suspicious_report_score(self.make_report(previous_flagged_report_count=2, corroborating_report_count=2))
        self.assertLess(supported_score.suspiciousness_score, unsupported_score.suspiciousness_score)
        self.assertIn("CORROBORATED_REPORTS", supported_score.flags)

    def test_conflicting_signals_are_review_flags(self):
        result = suspicious_report_score(self.make_report(latitude=91, metadata={"contradictory_information": True}))
        self.assertIn("CONTRADICTORY_INFORMATION", result.flags)
        self.assertTrue(result.review_recommended)

    def test_score_is_bounded(self):
        result = suspicious_report_score(self.make_report(latitude=91, longitude=181, reported_at=datetime(2030, 1, 1), previous_flagged_report_count=10, metadata={"suspicious_metadata": True}))
        self.assertGreaterEqual(result.suspiciousness_score, 0)
        self.assertLessEqual(result.suspiciousness_score, 100)

    def test_risk_thresholds(self):
        medium = suspicious_report_score(self.make_report(latitude=91, previous_flagged_report_count=1))
        high = suspicious_report_score(self.make_report(latitude=91, longitude=181, previous_flagged_report_count=2))
        self.assertEqual(medium.risk_level, RiskLevel.MEDIUM)
        self.assertEqual(high.risk_level, RiskLevel.HIGH)

    def test_reasons_correspond_to_actual_flags(self):
        result = suspicious_report_score(self.make_report(latitude=91, previous_flagged_report_count=2))
        self.assertEqual(len(result.flags), len(result.reasons))
        self.assertTrue(result.reasons)

    def test_medium_and_high_risk_recommend_review(self):
        result = suspicious_report_score(self.make_report(latitude=91, previous_flagged_report_count=1))
        self.assertEqual(result.risk_level, RiskLevel.MEDIUM)
        self.assertTrue(result.review_recommended)
        self.assertEqual(result.action, ReviewAction.REVIEW)

    def test_action_has_only_review_or_none(self):
        for result in (suspicious_report_score(self.make_report()), suspicious_report_score(self.make_report(latitude=91, longitude=181))):
            self.assertIn(result.action, (ReviewAction.NONE, ReviewAction.REVIEW))

    def test_no_automatic_reject_ban_suspend_or_close(self):
        result = suspicious_report_score(self.make_report(latitude=91, longitude=181, previous_flagged_report_count=5))
        self.assertNotIn(result.action.value, {"AUTO_REJECT", "AUTO_BAN", "AUTO_SUSPEND", "CLOSE_CASE"})

    def test_deterministic_repeated_execution(self):
        report = self.make_report(latitude=91, previous_flagged_report_count=2)
        first = suspicious_report_score(report).model_dump()
        second = suspicious_report_score(report).model_dump()
        self.assertEqual(first, second)

    def test_empty_partial_mapping_is_checked_safely(self):
        result = detect_duplicate_report(self.make_report(), [{"report_id": "partial", "text": ""}])
        self.assertFalse(result.duplicate_detected)

    def test_close_location_and_timestamp_are_reported(self):
        previous = self.make_report(report_id="report-old", latitude=18.0, longitude=73.0)
        current = self.make_report(latitude=18.005, longitude=73.005, reported_at=previous.reported_at + timedelta(minutes=10))
        result = detect_duplicate_report(current, [previous])
        self.assertIn("CLOSE_CONTEXT_MATCH", result.flags)

    def test_rapid_location_change_is_flagged(self):
        previous = self.make_report(report_id="report-old", latitude=18.0, longitude=73.0)
        current = self.make_report(latitude=19.0, longitude=74.0, reported_at=previous.reported_at + timedelta(minutes=5))
        result = suspicious_report_score(current, [previous])
        self.assertIn("RAPID_LOCATION_CHANGE", result.flags)

    def test_explicit_graph_conversion_does_not_auto_reject(self):
        report = self.make_report(latitude=91, longitude=181)
        result = suspicious_report_score(report)
        evidence = suspicious_result_to_evidence(report, result)
        self.assertEqual(evidence.status, EvidenceStatus.SUSPICIOUS)
        self.assertNotEqual(evidence.status, EvidenceStatus.REJECTED)

    def test_existing_graph_import_remains_compatible(self):
        from ai.graph.builder import EvidenceGraph

        graph = EvidenceGraph()
        self.assertIsNotNone(graph)


if __name__ == "__main__":
    unittest.main()
