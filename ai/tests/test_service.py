import unittest
from datetime import datetime

import numpy as np

from ai.service import (
    allocate_search_volunteers,
    analyze_report_risk,
    build_evidence_graph,
    check_possible_match,
    extract_witness_evidence,
    generate_police_case_summary,
    get_search_priority,
    recommend_search_radius,
    reprioritize_search,
)


class TestAIService(unittest.TestCase):
    def zone(self):
        return {
            "zone_id": "zone-1", "distance_km": 2, "time_elapsed_min": 40,
        "crowd_density": 0.5, "crowd_flow_score": 0.6, "exit_distance": 2,
        "witness_count": 1, "recent_sighting_count": 1, "direction_match": 0.7,
        "destination_match": 0.6, "coverage_percent": 20, "connectivity_score": 0.7,
        "zone_reopened": False, "transport_proximity": 0.5,
        }

    def test_service_imports_and_priority(self):
        result = get_search_priority(self.zone())
        self.assertTrue(result.success)
        self.assertEqual(result.status, "OK")
        self.assertEqual(result.result.zone_id, "zone-1")
        self.assertTrue(result.model_version)

    def test_reprioritization_service(self):
        evidence = {
            "evidence_id": "e1", "case_id": "case-1", "zone_id": "zone-1",
            "type": "SIGHTING", "location": "zone-1", "timestamp": "2026-09-21T10:00:00Z",
            "description": "Synthetic sighting", "confidence": 0.8, "source": "test",
        }
        result = reprioritize_search(self.zone(), evidence)
        self.assertTrue(result.success)
        self.assertIn("new_score", result.result)

    def test_nlp_service(self):
        report = {
            "report_id": "r1", "case_id": "case-1", "zone_id": "zone-1",
            "text": "I saw a child near the gate.", "source": "synthetic",
            "reported_at": datetime(2026, 9, 21, 10, 0),
        }
        result = extract_witness_evidence(report)
        self.assertTrue(result.success)
        self.assertEqual(result.result["evidence"].type.value, "WITNESS")

    def test_graph_service(self):
        evidence = [{
            "evidence_id": "e1", "case_id": "case-1", "zone_id": "zone-1",
            "type": "WITNESS", "location": "zone-1", "timestamp": "2026-09-21T10:00:00Z",
            "description": "Synthetic witness", "confidence": 0.5, "source": "test",
        }]
        result = build_evidence_graph(evidence)
        self.assertTrue(result.success)
        self.assertEqual(len(result.result["nodes"]), 1)

    def test_vision_service(self):
        image = np.arange(32 * 32, dtype=float).reshape(32, 32)
        result = check_possible_match(image, {"pixels": image})
        self.assertTrue(result.success)
        self.assertTrue(result.result.requires_human_verification)

    def test_anomaly_service(self):
        report = {
            "report_id": "r1", "case_id": "case-1", "text": "Synthetic report",
            "source": "test", "reported_at": datetime(2026, 9, 21),
        }
        result = analyze_report_risk(report)
        self.assertTrue(result.success)
        self.assertEqual(result.result.report_id, "r1")

    def test_allocation_service(self):
        volunteers = [{"volunteer_id": "v1", "available": True, "max_capacity": 1}]
        zones = [{"zone_id": "z1", "priority_score": 80, "required_volunteers": 1, "coverage_percent": 0}]
        result = allocate_search_volunteers(volunteers, zones)
        self.assertTrue(result.success)
        self.assertEqual(len(result.result.assignments), 1)

    def test_radius_service(self):
        result = recommend_search_radius({"time_elapsed_min": 90})
        self.assertTrue(result.success)
        self.assertTrue(result.result.recommended_radius_km >= 0)

    def test_police_summary_service(self):
        result = generate_police_case_summary({"case_id": "case-1", "last_known_location": "Gate"})
        self.assertTrue(result.success)
        self.assertEqual(result.result.case_id, "case-1")

    def test_invalid_input_returns_structured_error(self):
        result = get_search_priority({"zone_id": "invalid"})
        self.assertFalse(result.success)
        self.assertEqual(result.status, "VALIDATION_ERROR")
        self.assertTrue(result.error)

    def test_repeated_radius_call_is_deterministic(self):
        first = recommend_search_radius({"time_elapsed_min": 90}).result.model_dump(exclude={"generated_at"})
        second = recommend_search_radius({"time_elapsed_min": 90}).result.model_dump(exclude={"generated_at"})
        self.assertEqual(first, second)


if __name__ == "__main__":
    unittest.main()
