"""Demo runner for the TraceOne search priority MVP.

This script loads synthetic demo data and prints readable priority summaries for both the
base engine and the evidence-graph reprioritization flow.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

if __package__ in (None, ""):
    repo_root = Path(__file__).resolve().parent.parent
    if str(repo_root) not in sys.path:
        sys.path.insert(0, str(repo_root))

from ai.graph.builder import EvidenceGraph
from ai.graph.model import Evidence, EvidenceStatus, EvidenceType
from ai.priority.features import SearchZoneInput
from ai.priority.predict import predict_search_priority
from ai.priority.reprioritize import reprioritize_zone


def _build_demo_zone() -> SearchZoneInput:
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
    demo_path = Path(__file__).resolve().parent / "data" / "demo_zones.json"
    with demo_path.open("r", encoding="utf-8") as file:
        payload = json.load(file)

    print("TraceOne Search Priority Engine Demo")
    print("SYNTHETIC DEMO EVIDENCE")
    print("Synthetic demo data only. Not real missing-person data.\n")

    for zone in payload["zones"]:
        result = predict_search_priority(zone)
        print(f"Zone: {result.zone_id}")
        print(f"Priority: {result.priority_score:.1f}")
        print(f"Level: {result.priority_level}")
        print("Reasons:")
        for reason in result.reasons:
            print(f"- {reason}")
        print()

    zone = _build_demo_zone()
    initial = predict_search_priority(zone)
    graph = EvidenceGraph()

    sighting = Evidence(
        evidence_id="demo-sighting-1",
        case_id="demo-case-1",
        zone_id="ZONE_A",
        type=EvidenceType.SIGHTING,
        location="ZONE_A",
        timestamp="2026-09-21T10:00:00Z",
        description="SYNTHETIC DEMO EVIDENCE: sighting near the transit hub.",
        confidence=0.85,
        source="demo",
        status=EvidenceStatus.VERIFIED,
    )
    direction = Evidence(
        evidence_id="demo-direction-1",
        case_id="demo-case-1",
        zone_id="ZONE_A",
        type=EvidenceType.DIRECTION,
        location="ZONE_A",
        timestamp="2026-09-21T10:05:00Z",
        description="SYNTHETIC DEMO EVIDENCE: movement toward the station corridor.",
        confidence=0.8,
        source="demo",
        status=EvidenceStatus.VERIFIED,
    )

    graph.add_evidence(sighting)
    graph.add_evidence(direction)
    graph.link_evidence(sighting.evidence_id, direction.evidence_id, "CORROBORATES")

    print("Dynamic Reprioritization Demo")
    print("Initial zone priority:")
    print(f"- Zone: {initial.zone_id}")
    print(f"- Score: {initial.priority_score:.1f}")
    print(f"- Level: {initial.priority_level}\n")

    reprioritized = reprioritize_zone(zone, direction)
    print("Evidence graph summary:")
    print(f"- Evidence nodes: {len(graph.evidence)}")
    print(f"- Relationships: {len(graph.graph.edges)}")
    print(f"- Zone evidence: {len(graph.get_zone_evidence('ZONE_A'))}\n")

    print("Updated search priority:")
    print(f"- Previous score: {reprioritized['previous_score']:.1f}")
    print(f"- New score: {reprioritized['new_score']:.1f}")
    print(f"- Score delta: {reprioritized['score_delta']:.1f}")
    print(f"- Previous level: {reprioritized['previous_level']}")
    print(f"- New level: {reprioritized['new_level']}")
    print("Why the priority changed:")
    for reason in reprioritized["new_reasons"]:
        print(f"- {reason}")


if __name__ == "__main__":
    main()
