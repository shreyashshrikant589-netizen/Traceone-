import unittest
from datetime import datetime

from ai.police import generate_police_summary


class TestPoliceSummary(unittest.TestCase):
    def setUp(self):
        self.case = {
            "case_id": "case-1",
            "person_description": "Child wearing a red shirt",
            "last_known_location": "North Gate",
            "last_known_time": "2026-09-21T09:30:00Z",
        }
        self.evidence = [
            {"evidence_id": "e1", "type": "SIGHTING", "status": "VERIFIED", "location": "North Gate", "timestamp": "2026-09-21T09:30:00Z"},
            {"evidence_id": "e2", "type": "WITNESS", "status": "PENDING_REVIEW", "description": "Direction toward the bus stand.", "timestamp": "2026-09-21T09:45:00Z"},
        ]
        self.search = {"current_search_area": "North Gate perimeter", "searched_zones": ["zone-1"], "status": "IN_PROGRESS"}

    def test_basic_summary_generation(self):
        result = generate_police_summary(self.case, self.evidence, self.search)
        self.assertIn("Case case-1", result.summary)
        self.assertTrue(result.summary)

    def test_case_id_preserved(self):
        self.assertEqual(generate_police_summary(self.case).case_id, "case-1")

    def test_last_known_location_preserved(self):
        self.assertEqual(generate_police_summary(self.case).last_known_location, "North Gate")

    def test_last_known_time_preserved(self):
        self.assertEqual(generate_police_summary(self.case).last_known_time, "2026-09-21T09:30:00Z")

    def test_verified_evidence_included(self):
        result = generate_police_summary(self.case, self.evidence, self.search)
        self.assertEqual(len(result.sightings), 1)
        self.assertEqual(result.sightings[0]["status"], "VERIFIED")

    def test_unresolved_evidence_handled_safely(self):
        result = generate_police_summary(self.case, [{"type": "SIGHTING", "status": "RAW"}], None)
        self.assertIn("search activity is not provided", result.unresolved_items)

    def test_missing_fields_do_not_crash(self):
        result = generate_police_summary({}, None, None)
        self.assertIsNone(result.case_id)
        self.assertTrue(result.unresolved_items)

    def test_no_fabricated_facts(self):
        result = generate_police_summary({"case_id": "case-2"})
        self.assertNotIn("found", result.summary.lower())
        self.assertNotIn("confirmed", result.summary.lower())
        self.assertIsNone(result.last_known_location)

    def test_multiple_sightings_handled(self):
        evidence = self.evidence + [{"type": "OBSERVATION", "status": "RAW", "location": "Bus Stand"}]
        self.assertEqual(len(generate_police_summary(self.case, evidence).sightings), 2)

    def test_search_activity_included(self):
        result = generate_police_summary(self.case, self.evidence, self.search)
        self.assertEqual(result.current_search_area, "North Gate perimeter")
        self.assertEqual(result.search_activity["status"], "IN_PROGRESS")

    def test_deterministic_output_structure(self):
        first = generate_police_summary(self.case, self.evidence, self.search)
        second = generate_police_summary(self.case, self.evidence, self.search)
        self.assertEqual(first.case_id, second.case_id)
        self.assertEqual(first.summary, second.summary)
        self.assertEqual(first.relevant_evidence, second.relevant_evidence)

    def test_generator_version_exists(self):
        self.assertTrue(generate_police_summary(self.case).generator_version)

    def test_model_input_is_supported(self):
        result = generate_police_summary({"case_id": "case-3", "generated_at": datetime(2026, 9, 21)})
        self.assertEqual(result.case_id, "case-3")


if __name__ == "__main__":
    unittest.main()
