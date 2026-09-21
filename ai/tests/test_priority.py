import unittest

from pydantic import ValidationError

from ai.priority.features import SearchZoneInput
from ai.priority.predict import predict_search_priority


class TestSearchPriorityEngine(unittest.TestCase):
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

    def test_valid_zone_input(self):
        zone = self.make_zone()
        self.assertEqual(zone.zone_id, "zone-1")
        self.assertGreaterEqual(zone.distance_km, 0)

    def test_negative_invalid_distance_rejected(self):
        with self.assertRaises(ValidationError):
            self.make_zone(distance_km=-1)

    def test_negative_time_rejected(self):
        with self.assertRaises(ValidationError):
            self.make_zone(time_elapsed_min=-1)

    def test_score_stays_between_0_and_100(self):
        result = predict_search_priority(self.make_zone())
        self.assertGreaterEqual(result.priority_score, 0)
        self.assertLessEqual(result.priority_score, 100)

    def test_recent_sighting_increases_priority(self):
        base = self.make_zone()
        stronger = self.make_zone(recent_sighting_count=4, witness_count=3)
        base_result = predict_search_priority(base)
        strong_result = predict_search_priority(stronger)
        self.assertGreater(strong_result.priority_score, base_result.priority_score)

    def test_stronger_evidence_higher_than_weak_baseline(self):
        weak = self.make_zone(
            witness_count=0,
            recent_sighting_count=0,
            direction_match=0.1,
            destination_match=0.1,
            crowd_flow_score=0.2,
            coverage_percent=80,
        )
        strong = self.make_zone(
            witness_count=3,
            recent_sighting_count=2,
            direction_match=0.9,
            destination_match=0.9,
            crowd_flow_score=0.8,
            coverage_percent=25,
        )
        weak_result = predict_search_priority(weak)
        strong_result = predict_search_priority(strong)
        self.assertGreater(strong_result.priority_score, weak_result.priority_score)

    def test_high_search_coverage_reduces_priority(self):
        low_coverage = self.make_zone(coverage_percent=15)
        high_coverage = self.make_zone(coverage_percent=90)
        low_result = predict_search_priority(low_coverage)
        high_result = predict_search_priority(high_coverage)
        self.assertLess(high_result.priority_score, low_result.priority_score)

    def test_reasons_are_returned(self):
        result = predict_search_priority(self.make_zone())
        self.assertTrue(result.reasons)

    def test_feature_contributions_are_returned(self):
        result = predict_search_priority(self.make_zone())
        self.assertTrue(result.feature_contributions)

    def test_output_contains_model_version(self):
        result = predict_search_priority(self.make_zone())
        self.assertIn("heuristic-mvp-v1", result.model_version)

    def test_output_contains_generated_at(self):
        result = predict_search_priority(self.make_zone())
        self.assertTrue(result.generated_at)

    def test_invalid_feature_values_rejected(self):
        with self.assertRaises(ValidationError):
            self.make_zone(coverage_percent=150)


if __name__ == "__main__":
    unittest.main()
