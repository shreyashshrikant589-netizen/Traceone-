import unittest

from ai.radius import RadiusStage, SearchRadiusInput, recommend_search_radius


class TestSearchRadius(unittest.TestCase):
    def make_input(self, **overrides):
        values = {"current_radius_km": 0.0}
        values.update(overrides)
        return SearchRadiusInput(**values)

    def test_basic_venue_recommendation(self):
        result = recommend_search_radius(self.make_input())
        self.assertEqual(result.current_stage, RadiusStage.VENUE)
        self.assertEqual(result.recommended_radius_km, 1.0)
        self.assertIsNone(result.next_stage)

    def test_increasing_time_can_expand_stage(self):
        result = recommend_search_radius(self.make_input(time_elapsed_min=180))
        self.assertEqual(result.next_stage, RadiusStage.PERIMETER)
        self.assertGreater(result.recommended_radius_km, 0)

    def test_exit_evidence_affects_recommendation(self):
        result = recommend_search_radius(self.make_input(exit_distance=1.0))
        self.assertIn("roads and exit routes", " ".join(result.reasons))
        self.assertGreater(result.expansion_score, 0)

    def test_recent_sighting_affects_recommendation(self):
        result = recommend_search_radius(self.make_input(recent_sighting_count=1))
        self.assertIn("Recent sighting", " ".join(result.reasons))

    def test_direction_evidence_affects_recommendation(self):
        result = recommend_search_radius(self.make_input(direction_match=0.9))
        self.assertIn("directional evidence", " ".join(result.reasons))

    def test_transport_connectivity_affects_recommendation(self):
        result = recommend_search_radius(self.make_input(connectivity_score=0.9))
        self.assertIn("transport nodes", " ".join(result.reasons))

    def test_high_coverage_prevents_unnecessary_expansion(self):
        result = recommend_search_radius(self.make_input(time_elapsed_min=180, connectivity_score=1.0, coverage_percent=90))
        self.assertEqual(result.recommended_radius_km, 1.0)
        self.assertIsNone(result.next_stage)

    def test_known_destination_affects_recommendation(self):
        result = recommend_search_radius(self.make_input(destination_match=0.9))
        self.assertIn("destination area", " ".join(result.reasons))

    def test_repeated_result_is_deterministic(self):
        data = self.make_input(time_elapsed_min=90, direction_match=0.8, coverage_percent=20)
        self.assertEqual(recommend_search_radius(data), recommend_search_radius(data))

    def test_output_structure(self):
        result = recommend_search_radius(self.make_input())
        self.assertIsInstance(result.current_stage, RadiusStage)
        self.assertGreaterEqual(result.recommended_radius_km, 0)
        self.assertTrue(result.model_version)
        self.assertIsInstance(result.reasons, list)

    def test_empty_weak_evidence_is_safe(self):
        result = recommend_search_radius(SearchRadiusInput())
        self.assertGreaterEqual(result.expansion_score, 0)
        self.assertEqual(result.current_stage, RadiusStage.VENUE)

    def test_radius_is_never_negative(self):
        result = recommend_search_radius(self.make_input(current_radius_km=2.0))
        self.assertGreaterEqual(result.recommended_radius_km, 0)


if __name__ == "__main__":
    unittest.main()
