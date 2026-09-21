"""Synthetic witness NLP demonstration for the TraceOne AI module."""

from __future__ import annotations

from datetime import datetime
import sys
from pathlib import Path

if __package__ in (None, ""):
    repo_root = Path(__file__).resolve().parent.parent
    if str(repo_root) not in sys.path:
        sys.path.insert(0, str(repo_root))

from ai.graph.builder import EvidenceGraph
from ai.nlp.extractor import extract_witness_report, process_witness_report, witness_result_to_evidence
from ai.nlp.schemas import WitnessReportInput
from ai.priority.features import SearchZoneInput


def build_zone() -> SearchZoneInput:
    return SearchZoneInput(
        zone_id="ZONE_A",
        distance_km=2.0,
        time_elapsed_min=40.0,
        crowd_density=0.75,
        crowd_flow_score=0.8,
        exit_distance=1.1,
        witness_count=2,
        recent_sighting_count=1,
        direction_match=0.9,
        destination_match=0.7,
        coverage_percent=35.0,
        connectivity_score=0.8,
        zone_reopened=False,
        transport_proximity=0.7,
    )


def main() -> None:
    print("TraceOne Witness NLP Demo")
    print("SYNTHETIC DEMO EVIDENCE")
    print("Synthetic demo data only. Not real missing-person data.\n")

    examples = [
        ("Example 1 - English", "I saw a child wearing a red shirt near the main gate about 10 minutes ago. He was heading towards the bus stand."),
        ("Example 2 - Marathi", "मी लाल शर्ट घातलेल्या मुलाला मुख्य गेटजवळ पाहिले. तो बस स्टँडकडे जात होता."),
    ]

    for label, text in examples:
        print(f"{label}:")
        report = WitnessReportInput(
            report_id=f"demo-{label.lower().replace(' ', '-')}",
            case_id="case-demo-1",
            zone_id="ZONE_A",
            text=text,
            source="synthetic-demo",
            reported_at=datetime(2026, 9, 21, 10, 0, 0),
            location="main gate",
        )
        extraction = extract_witness_report(report)
        evidence = witness_result_to_evidence(extraction)
        graph = EvidenceGraph()
        graph.add_evidence(evidence)

        print(f"- Original report: {report.text}")
        print(f"- Person: {extraction.person_type}")
        print(f"- Clothing: {extraction.clothing}")
        print(f"- Colors: {extraction.colors}")
        print(f"- Direction: {extraction.direction}")
        print(f"- Location: {extraction.location}")
        print(f"- Destination: {extraction.destination}")
        print(f"- Time: {extraction.time_reference}")
        print(f"- Extraction confidence: {extraction.extraction_confidence}")
        print(f"- Converted evidence: {evidence.model_dump()}")
        print(f"- Evidence status: {evidence.status}")
        print(f"- Graph integration: {graph.export()}")

        result = process_witness_report(report, build_zone())
        print(f"- Reprioritized result: {result['reprioritized_zone']}")
        print()


if __name__ == "__main__":
    main()
