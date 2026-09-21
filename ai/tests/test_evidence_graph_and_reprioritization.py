import unittest

from pydantic import ValidationError

from ai.graph.builder import EvidenceGraph
from ai.graph.model import Evidence, EvidenceStatus, EvidenceType
from ai.priority.features import SearchZoneInput
from ai.priority.predict import predict_search_priority
from ai.priority.reprioritize import reprioritize_zone


class TestEvidenceGraphAndReprioritization(unittest.TestCase):
    def make_zone(self, **overrides):
        base = {
            "zone_id": "zone-1",
            "distance_km": 2.0,
            "time_elapsed_min": 40.0,
            "crowd_density": 0.75,
            "crowd_flow_score": 0.8,
            "exit_distance": 1.1,
            "witness_count": 2,
            "recent_sighting_count": 1,
            "direction_match": 0.9,
            "destination_match": 0.7,
            "coverage_percent": 35.0,
            "connectivity_score": 0.8,
            "zone_reopened": False,
            "transport_proximity": 0.7,
        }
        base.update(overrides)
        return SearchZoneInput(**base)

    def make_evidence(self, **overrides):
        base = {
            "evidence_id": "ev-001",
            "case_id": "case-001",
            "zone_id": "zone-1",
            "type": EvidenceType.SIGHTING,
            "location": "zone-1",
            "timestamp": "2026-09-21T10:00:00Z",
            "description": "Saw a person near the transit hub.",
            "confidence": 0.82,
            "source": "witness",
            "status": EvidenceStatus.VERIFIED,
        }
        base.update(overrides)
        return Evidence(**base)

    def test_valid_evidence_accepted(self):
        evidence = self.make_evidence()
        self.assertEqual(evidence.evidence_id, "ev-001")
        self.assertGreaterEqual(evidence.confidence, 0.0)

    def test_invalid_confidence_rejected(self):
        with self.assertRaises(ValidationError):
            self.make_evidence(confidence=1.5)

    def test_invalid_evidence_type_rejected(self):
        with self.assertRaises(ValidationError):
            self.make_evidence(type="NOT_A_REAL_TYPE")

    def test_invalid_status_rejected(self):
        with self.assertRaises(ValidationError):
            self.make_evidence(status="NOT_A_STATUS")

    def test_evidence_node_can_be_added(self):
        graph = EvidenceGraph()
        evidence = self.make_evidence()
        graph.add_evidence(evidence)
        self.assertIn(evidence.evidence_id, graph.evidence)

    def test_evidence_can_be_retrieved(self):
        graph = EvidenceGraph()
        evidence = self.make_evidence()
        graph.add_evidence(evidence)
        self.assertEqual(graph.get_evidence(evidence.evidence_id).evidence_id, evidence.evidence_id)

    def test_evidence_can_be_linked(self):
        graph = EvidenceGraph()
        first = self.make_evidence(evidence_id="ev-1", type=EvidenceType.WITNESS)
        second = self.make_evidence(evidence_id="ev-2", type=EvidenceType.SIGHTING)
        graph.add_evidence(first)
        graph.add_evidence(second)
        graph.link_evidence(first.evidence_id, second.evidence_id, "CORROBORATES")
        self.assertIn(second.evidence_id, graph.get_neighbors(first.evidence_id))

    def test_zone_evidence_can_be_retrieved(self):
        graph = EvidenceGraph()
        first = self.make_evidence(evidence_id="ev-1", zone_id="zone-1")
        second = self.make_evidence(evidence_id="ev-2", zone_id="zone-2")
        graph.add_evidence(first)
        graph.add_evidence(second)
        self.assertEqual(len(graph.get_zone_evidence("zone-1")), 1)

    def test_new_sighting_changes_priority(self):
        zone = self.make_zone(recent_sighting_count=0, witness_count=0, direction_match=0.2, coverage_percent=30)
        old_result = predict_search_priority(zone)
        result = reprioritize_zone(zone, self.make_evidence(type=EvidenceType.SIGHTING, confidence=0.9))
        self.assertGreater(result["new_score"], old_result.priority_score)

    def test_new_witness_evidence_changes_priority(self):
        zone = self.make_zone(witness_count=0, recent_sighting_count=0, coverage_percent=45)
        result = reprioritize_zone(zone, self.make_evidence(type=EvidenceType.WITNESS, confidence=0.8))
        self.assertGreater(result["score_delta"], 0)

    def test_direction_evidence_changes_priority(self):
        zone = self.make_zone(direction_match=0.2, recent_sighting_count=0)
        result = reprioritize_zone(zone, self.make_evidence(type=EvidenceType.DIRECTION, confidence=0.7))
        self.assertGreater(result["new_score"], result["previous_score"])

    def test_increased_search_coverage_lowers_priority(self):
        zone = self.make_zone(coverage_percent=25, recent_sighting_count=0, witness_count=0)
        result = reprioritize_zone(zone, self.make_evidence(type=EvidenceType.SEARCH_RESULT, confidence=0.9, description="Search team completed a full sweep of the zone."))
        self.assertLess(result["new_score"], result["previous_score"])

    def test_old_score_is_preserved(self):
        zone = self.make_zone(recent_sighting_count=0)
        result = reprioritize_zone(zone, self.make_evidence(type=EvidenceType.SIGHTING, confidence=0.8))
        self.assertEqual(result["previous_score"], predict_search_priority(zone).priority_score)

    def test_new_score_is_calculated(self):
        zone = self.make_zone(recent_sighting_count=0)
        result = reprioritize_zone(zone, self.make_evidence(type=EvidenceType.SIGHTING, confidence=0.8))
        self.assertGreater(result["new_score"], 0)
        self.assertIsInstance(result["new_score"], float)

    def test_score_delta_is_correct(self):
        zone = self.make_zone(recent_sighting_count=0)
        result = reprioritize_zone(zone, self.make_evidence(type=EvidenceType.SIGHTING, confidence=0.8))
        self.assertAlmostEqual(result["score_delta"], result["new_score"] - result["previous_score"], places=2)

    def test_changed_features_are_reported(self):
        zone = self.make_zone(recent_sighting_count=0, direction_match=0.1)
        result = reprioritize_zone(zone, self.make_evidence(type=EvidenceType.SIGHTING, confidence=0.8))
        self.assertTrue(result["changed_features"])

    def test_explanation_is_returned(self):
        zone = self.make_zone(recent_sighting_count=0)
        result = reprioritize_zone(zone, self.make_evidence(type=EvidenceType.SIGHTING, confidence=0.8))
        self.assertTrue(result["new_reasons"])

    def test_previous_prediction_is_not_mutated(self):
        zone = self.make_zone(recent_sighting_count=0)
        previous = predict_search_priority(zone)
        _ = reprioritize_zone(zone, self.make_evidence(type=EvidenceType.SIGHTING, confidence=0.9))
        self.assertEqual(previous.priority_score, predict_search_priority(zone).priority_score)


if __name__ == "__main__":
    unittest.main()
