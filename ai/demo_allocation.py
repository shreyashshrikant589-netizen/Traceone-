"""Synthetic Smart Volunteer Allocation demonstration."""

from __future__ import annotations

import sys
from pathlib import Path

if __package__ in (None, ""):
    repo_root = Path(__file__).resolve().parent.parent
    if str(repo_root) not in sys.path:
        sys.path.insert(0, str(repo_root))

from ai.allocation import VolunteerInput, VolunteerStatus, ZoneInput, ZoneStatus, allocate_volunteers


def main() -> None:
    volunteers = [
        VolunteerInput(volunteer_id="volunteer-1", latitude=18.5204, longitude=73.8567, available=True, max_capacity=2, skills=["MAP_READING"]),
        VolunteerInput(volunteer_id="volunteer-2", latitude=18.5300, longitude=73.8600, available=True, max_capacity=1, skills=["COMMUNICATION"]),
        VolunteerInput(volunteer_id="volunteer-3", latitude=18.5000, longitude=73.8400, available=True, max_capacity=1),
        VolunteerInput(volunteer_id="volunteer-4", available=True, max_capacity=1),
        VolunteerInput(volunteer_id="volunteer-busy", latitude=18.52, longitude=73.85, available=True, status=VolunteerStatus.BUSY, max_capacity=1),
    ]
    zones = [
        ZoneInput(zone_id="zone-high", priority_score=90, latitude=18.5204, longitude=73.8567, required_volunteers=2, coverage_percent=15, status=ZoneStatus.UNSEARCHED),
        ZoneInput(zone_id="zone-reopened", priority_score=75, latitude=18.5300, longitude=73.8600, required_volunteers=1, coverage_percent=40, status=ZoneStatus.REOPENED),
        ZoneInput(zone_id="zone-low", priority_score=35, latitude=18.5000, longitude=73.8400, required_volunteers=1, coverage_percent=5, status=ZoneStatus.UNSEARCHED),
        ZoneInput(zone_id="zone-searched", priority_score=100, latitude=18.52, longitude=73.85, required_volunteers=1, coverage_percent=100, status=ZoneStatus.SEARCHED),
    ]
    result = allocate_volunteers(volunteers, zones)

    print("TraceOne Smart Volunteer Allocation Demo")
    print("DEMO ONLY - synthetic volunteer and zone data.")
    print("MVP uses greedy allocation; Case Manager review required.\n")
    for zone in zones:
        print(f"Zone {zone.zone_id}: priority={zone.priority_score:.1f}, coverage={zone.coverage_percent:.1f}%, status={zone.status.value}")
    print()
    for assignment in result.assignments:
        print(f"Assignment {assignment.assignment_id}")
        print(f"- Volunteer: {assignment.volunteer_id}")
        print(f"- Zone: {assignment.zone_id}")
        print(f"- Distance km: {assignment.distance_km}")
        print(f"- Allocation score: {assignment.allocation_score:.2f}")
        print(f"- Reason: {assignment.reason}")
        print(f"- Requires review: {assignment.requires_review}")
    print(f"\nUnfilled zones: {result.unfilled_zones or ['NONE']}")
    print(f"Unassigned volunteers: {result.unassigned_volunteers or ['NONE']}")
    print(f"Algorithm: {result.algorithm}")
    print(f"Model version: {result.model_version}")


if __name__ == "__main__":
    main()
