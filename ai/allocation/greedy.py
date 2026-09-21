"""Deterministic greedy volunteer allocation for the MVP."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Iterable

from ai.allocation.constraints import has_valid_coordinates, is_volunteer_eligible, is_zone_eligible
from ai.allocation.distance import calculate_distance_km
from ai.allocation.schemas import AllocationResult, VolunteerAssignment, VolunteerInput, ZoneInput, ZoneStatus

MODEL_VERSION = "allocation-mvp-0.1"


def _as_volunteer(value: VolunteerInput | dict[str, object]) -> VolunteerInput:
    return value if isinstance(value, VolunteerInput) else VolunteerInput(**value)


def _as_zone(value: ZoneInput | dict[str, object]) -> ZoneInput:
    return value if isinstance(value, ZoneInput) else ZoneInput(**value)


def calculate_allocation_score(volunteer: VolunteerInput, zone: ZoneInput, distance_km: float | None, effective_assignment_count: int) -> float:
    """Calculate assignment suitability, not probability of finding a person."""
    score = zone.priority_score * 0.60
    score += 10.0
    score += (1.0 - zone.coverage_percent / 100.0) * 15.0
    if zone.status == ZoneStatus.REOPENED:
        score += 2.0
    if zone.required_skills:
        matching_skills = len(set(volunteer.skills) & set(zone.required_skills))
        score += 10.0 * matching_skills / len(set(zone.required_skills))
    if volunteer.max_capacity > 0:
        remaining_ratio = max(0.0, 1.0 - effective_assignment_count / volunteer.max_capacity)
        score += remaining_ratio * 10.0
    if distance_km is not None:
        score -= min(distance_km / 50.0, 1.0) * 15.0
    return round(max(0.0, min(100.0, score)), 4)


def _assignment_reason(volunteer: VolunteerInput, zone: ZoneInput, distance_km: float | None) -> str:
    priority_text = f"Zone priority score {zone.priority_score:.1f}"
    availability_text = "volunteer is available with remaining capacity"
    coverage_text = f"coverage is {zone.coverage_percent:.1f}%"
    details = [priority_text, availability_text, coverage_text]
    if distance_km is not None:
        details.append(f"distance is {distance_km:.2f} km")
    else:
        details.append("distance was unavailable")
    if zone.required_skills:
        matching = sorted(set(volunteer.skills) & set(zone.required_skills))
        if matching:
            details.append(f"matching skills: {', '.join(matching)}")
    return "; ".join(details) + "."


def allocate_volunteers(volunteers: Iterable[VolunteerInput | dict[str, object]], zones: Iterable[ZoneInput | dict[str, object]]) -> AllocationResult:
    """Assign eligible volunteers greedily to highest-priority eligible zones."""
    volunteer_list = [_as_volunteer(volunteer) for volunteer in volunteers]
    zone_list = [_as_zone(zone) for zone in zones]
    eligible_volunteers = [volunteer for volunteer in volunteer_list if is_volunteer_eligible(volunteer)]
    eligible_zones = [zone for zone in zone_list if is_zone_eligible(zone)]
    ordered_zones = sorted(eligible_zones, key=lambda zone: (-zone.priority_score, zone.coverage_percent, zone.zone_id))
    additional_assignments: dict[str, int] = {volunteer.volunteer_id: 0 for volunteer in eligible_volunteers}
    assignments: list[VolunteerAssignment] = []
    unfilled_zones: list[str] = []

    for zone in ordered_zones:
        selected_for_zone: set[str] = set()
        while len(selected_for_zone) < zone.required_volunteers:
            candidates: list[tuple[float, float, VolunteerInput, float | None]] = []
            for volunteer in eligible_volunteers:
                if volunteer.volunteer_id in selected_for_zone:
                    continue
                effective_count = volunteer.current_assignment_count + additional_assignments[volunteer.volunteer_id]
                if effective_count >= volunteer.max_capacity:
                    continue
                distance = calculate_distance_km(volunteer.latitude, volunteer.longitude, zone.latitude, zone.longitude)
                score = calculate_allocation_score(volunteer, zone, distance, effective_count)
                sort_distance = distance if distance is not None else float("inf")
                candidates.append((score, sort_distance, volunteer, distance))
            if not candidates:
                break
            _, _, selected_volunteer, distance = max(candidates, key=lambda item: (item[0], -item[1], item[2].volunteer_id))
            additional_assignments[selected_volunteer.volunteer_id] += 1
            selected_for_zone.add(selected_volunteer.volunteer_id)
            effective_count = selected_volunteer.current_assignment_count + additional_assignments[selected_volunteer.volunteer_id] - 1
            score = calculate_allocation_score(selected_volunteer, zone, distance, effective_count)
            assignments.append(
                VolunteerAssignment(
                    assignment_id=f"assignment-{zone.zone_id}-{selected_volunteer.volunteer_id}",
                    volunteer_id=selected_volunteer.volunteer_id,
                    zone_id=zone.zone_id,
                    allocation_score=score,
                    distance_km=distance,
                    reason=_assignment_reason(selected_volunteer, zone, distance),
                    requires_review=True,
                )
            )
        if len(selected_for_zone) < zone.required_volunteers:
            unfilled_zones.append(zone.zone_id)

    assigned_ids = {assignment.volunteer_id for assignment in assignments}
    unassigned_volunteers = [volunteer.volunteer_id for volunteer in volunteer_list if volunteer.volunteer_id not in assigned_ids]
    return AllocationResult(
        assignments=assignments,
        unassigned_volunteers=unassigned_volunteers,
        unfilled_zones=unfilled_zones,
        model_version=MODEL_VERSION,
        generated_at=datetime.now(timezone.utc),
        algorithm="greedy",
    )
