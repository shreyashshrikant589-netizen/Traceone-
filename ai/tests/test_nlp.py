import unittest
from datetime import datetime

from ai.graph.builder import EvidenceGraph
from ai.graph.model import EvidenceStatus, EvidenceType
from ai.nlp.extractor import extract_witness_report, process_witness_report, witness_result_to_evidence
from ai.nlp.schemas import WitnessReportInput
from ai.priority.features import SearchZoneInput


class TestWitnessNLP(unittest.TestCase):
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

    def make_report(self, **overrides):
        base = {
            "report_id": "r-001",
            "case_id": "case-001",
            "zone_id": "zone-1",
            "text": "I saw a child wearing a red shirt near the main gate about 10 minutes ago. He was heading towards the bus stand.",
            "source": "witness",
            "reported_at": datetime(2026, 9, 21, 10, 0, 0),
            "location": "main gate",
        }
        base.update(overrides)
        return WitnessReportInput(**base)

    def test_english_witness_report(self):
        result = extract_witness_report(self.make_report())
        self.assertIn("child", str(result.person_type))
        self.assertTrue(result.clothing)

    def test_basic_marathi_witness_report(self):
        report = self.make_report(
            report_id="r-002",
            text="मी लाल शर्ट घातलेल्या मुलाला मुख्य गेटजवळ पाहिले. तो बस स्टँडकडे जात होता.",
        )
        result = extract_witness_report(report)
        self.assertTrue(result.person_type or result.clothing or result.direction or result.location)

    def test_person_extraction(self):
        result = extract_witness_report(self.make_report(text="I saw a child near the gate."))
        self.assertIsNotNone(result.person_type)

    def test_clothing_extraction(self):
        result = extract_witness_report(self.make_report(text="He was wearing a red shirt."))
        self.assertTrue(result.clothing)

    def test_color_extraction(self):
        result = extract_witness_report(self.make_report(text="She had a blue shirt on."))
        self.assertIn("blue", result.colors)

    def test_direction_extraction(self):
        result = extract_witness_report(self.make_report(text="He was heading towards the bus stand."))
        self.assertIsNotNone(result.direction)

    def test_location_extraction(self):
        result = extract_witness_report(self.make_report(text="The person was near the main gate."))
        self.assertIsNotNone(result.location)

    def test_destination_extraction(self):
        result = extract_witness_report(self.make_report(text="He was heading towards the bus stand."))
        self.assertEqual(result.destination, "bus stand")

    def test_time_extraction(self):
        result = extract_witness_report(self.make_report(text="I saw him 10 minutes ago."))
        self.assertIn("10 minutes ago", result.time_reference)

    def test_object_vehicle_extraction(self):
        result = extract_witness_report(self.make_report(text="He was carrying a backpack and walking toward the station."))
        self.assertTrue(result.object_hint or result.destination)

    def test_empty_or_vague_report(self):
        report = self.make_report(text="hello there")
        result = extract_witness_report(report)
        self.assertEqual(result.extraction_confidence, 0.0)

    def test_unknown_text_should_not_hallucinate_fields(self):
        report = self.make_report(text="a random statement without useful cues")
        result = extract_witness_report(report)
        self.assertIsNone(result.person_type)
        self.assertIsNone(result.direction)
        self.assertIsNone(result.location)

    def test_evidence_conversion(self):
        report = self.make_report(text="I saw a child wearing a red shirt near the main gate." )
        result = extract_witness_report(report)
        evidence = witness_result_to_evidence(result)
        self.assertEqual(evidence.type, EvidenceType.WITNESS)
        self.assertNotEqual(evidence.status, EvidenceStatus.VERIFIED)

    def test_evidence_type_is_witness(self):
        evidence = witness_result_to_evidence(extract_witness_report(self.make_report()))
        self.assertEqual(evidence.type, EvidenceType.WITNESS)

    def test_evidence_status_not_verified(self):
        evidence = witness_result_to_evidence(extract_witness_report(self.make_report()))
        self.assertNotEqual(evidence.status, EvidenceStatus.VERIFIED)

    def test_case_id_preservation(self):
        evidence = witness_result_to_evidence(extract_witness_report(self.make_report(case_id="case-42")))
        self.assertEqual(evidence.case_id, "case-42")

    def test_source_preservation(self):
        evidence = witness_result_to_evidence(extract_witness_report(self.make_report(source="caller")))
        self.assertEqual(evidence.source, "caller")

    def test_evidence_graph_integration(self):
        graph = EvidenceGraph()
        report = self.make_report(text="I saw a child near the bus stand.")
        evidence = witness_result_to_evidence(extract_witness_report(report))
        graph.add_evidence(evidence)
        self.assertIn(evidence.evidence_id, graph.evidence)

    def test_witness_evidence_can_flow_into_reprioritization(self):
        zone = self.make_zone(recent_sighting_count=0, witness_count=0)
        report = self.make_report(text="I saw a child wearing a red shirt heading towards the bus stand.")
        output = process_witness_report(report, zone)
        self.assertIn("reprioritized_zone", output)

    def test_existing_behavior_remains_compatible(self):
        zone = self.make_zone()
        result = process_witness_report(self.make_report())
        self.assertIn("report", result)
        self.assertIn("evidence", result)


if __name__ == "__main__":
    unittest.main()
