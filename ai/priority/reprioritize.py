"""Dynamic reprioritization logic for the TraceOne Search Priority Engine MVP.

This module updates a base zone using newly received evidence, recalculates the score,
and stores an in-memory audit trail of the event without mutating the original prediction.
"""

from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

from ai.graph.model import Evidence, EvidenceType
from ai.priority.features import SearchZoneInput
from ai.priority.predict import predict_search_priority
from ai.priority.rules import get_priority_level


class ZonePriorityHistory:
    """In-memory history store for reprioritization events."""

    def __init__(self) -> None:
        self._events: dict[str, list[dict[str, Any]]] = {}

    def add_event(self, zone_id: str, event: dict[str, Any]) -> dict[str, Any]:
        """Persist a reprioritization event for a zone."""
        self._events.setdefault(zone_id, []).append(event)
        return event

    def get_history(self, zone_id: str) -> list[dict[str, Any]]:
        """Return the full event history for a zone."""
        return list(self._events.get(zone_id, []))


PRIORITY_HISTORY = ZonePriorityHistory()


def _apply_evidence_to_zone(zone: SearchZoneInput, evidence: Evidence) -> tuple[SearchZoneInput, dict[str, dict[str, Any]]]:
    """Return a new zone with feature updates derived from a new evidence item."""
    updated = deepcopy(zone)
    changed: dict[str, dict[str, Any]] = {}

    def record(feature_name: str, old_value: Any, new_value: Any) -> None:
        if old_value != new_value:
            changed[feature_name] = {"old": old_value, "new": new_value}

    if evidence.type == EvidenceType.SIGHTING:
        old_value = updated.recent_sighting_count
        new_count = max(old_value, old_value + max(1, int(round(evidence.confidence * 2))))
        updated.recent_sighting_count = new_count
        record("recent_sighting_count", old_value, new_count)

    elif evidence.type == EvidenceType.WITNESS:
        old_value = updated.witness_count
        new_count = max(old_value, old_value + max(1, int(round(evidence.confidence * 2))))
        updated.witness_count = new_count
        record("witness_count", old_value, new_count)

    elif evidence.type == EvidenceType.DIRECTION:
        old_value = updated.direction_match
        new_value = max(old_value, min(1.0, old_value + evidence.confidence * 0.35))
        updated.direction_match = round(new_value, 4)
        record("direction_match", round(old_value, 4), round(new_value, 4))

    elif evidence.type == EvidenceType.EXIT:
        old_value = updated.exit_distance
        new_value = max(0.0, old_value - evidence.confidence * 1.5)
        updated.exit_distance = round(new_value, 2)
        record("exit_distance", round(old_value, 2), round(new_value, 2))

    elif evidence.type == EvidenceType.CROWD_FLOW:
        old_value = updated.crowd_flow_score
        new_value = max(old_value, min(1.0, old_value + evidence.confidence * 0.25))
        updated.crowd_flow_score = round(new_value, 4)
        record("crowd_flow_score", round(old_value, 4), round(new_value, 4))

    elif evidence.type == EvidenceType.SEARCH_RESULT:
        old_value = updated.coverage_percent
        new_value = min(100.0, old_value + evidence.confidence * 30.0)
        updated.coverage_percent = round(new_value, 2)
        record("coverage_percent", round(old_value, 2), round(new_value, 2))

    elif evidence.type == EvidenceType.OBSERVATION:
        old_value = updated.crowd_density
        new_value = min(1.0, old_value + evidence.confidence * 0.15)
        updated.crowd_density = round(new_value, 4)
        record("crowd_density", round(old_value, 4), round(new_value, 4))

    elif evidence.type == EvidenceType.LAST_SEEN:
        old_value = updated.distance_km
        new_value = max(0.0, old_value - evidence.confidence * 1.25)
        updated.distance_km = round(new_value, 2)
        record("distance_km", round(old_value, 2), round(new_value, 2))

    return updated, changed


def _describe_changed_features(changed_features: dict[str, dict[str, Any]]) -> list[str]:
    """Generate deterministic explanations for actual feature changes."""
    reasons: list[str] = []
    for feature_name, values in changed_features.items():
        old_value = values["old"]
        new_value = values["new"]

        if feature_name == "recent_sighting_count":
            reasons.append("Recent sighting evidence increased search priority.")
        elif feature_name == "witness_count":
            reasons.append("Witness evidence increased priority due to additional corroboration.")
        elif feature_name == "direction_match":
            if new_value > old_value:
                reasons.append("Direction evidence increased alignment with the reported movement direction.")
        elif feature_name == "coverage_percent":
            if new_value > old_value:
                reasons.append("Search coverage reduced priority because this zone has already received substantial search coverage.")
        elif feature_name == "exit_distance":
            if new_value < old_value:
                reasons.append("Exit evidence increased priority because the zone is closer to a likely escape route.")
        elif feature_name == "crowd_flow_score":
            if new_value > old_value:
                reasons.append("Crowd-flow evidence increased the relevance of the zone.")
        elif feature_name == "crowd_density":
            if new_value > old_value:
                reasons.append("Observation evidence increased the local relevance of this zone.")
        elif feature_name == "distance_km":
            if new_value < old_value:
                reasons.append("Recent location evidence moved the zone closer to the likely search area.")

    return reasons


def reprioritize_zone(
    previous_zone: SearchZoneInput | dict[str, Any],
    new_evidence: Evidence | dict[str, Any],
) -> dict[str, Any]:
    """Validate a prior zone and a new evidence item, recalculate priority, and return a structured audit record.

    The function intentionally does not mutate the original prediction result. It returns a new
    record describing the delta between the previous and updated scores.
    """
    if isinstance(previous_zone, dict):
        zone = SearchZoneInput(**previous_zone)
    else:
        zone = previous_zone

    if isinstance(new_evidence, dict):
        evidence = Evidence(**new_evidence)
    else:
        evidence = new_evidence

    previous_result = predict_search_priority(zone)
    updated_zone, changed_features = _apply_evidence_to_zone(zone, evidence)
    new_result = predict_search_priority(updated_zone)
    score_delta = round(float(new_result.priority_score) - float(previous_result.priority_score), 2)

    previous_level = previous_result.priority_level
    new_level = new_result.priority_level

    feature_reasons = _describe_changed_features(changed_features)
    direct_reasons = [reason for reason in new_result.reasons if reason not in previous_result.reasons]
    new_reasons = feature_reasons + [reason for reason in direct_reasons if reason not in feature_reasons]

    result = {
        "zone_id": updated_zone.zone_id,
        "previous_score": round(float(previous_result.priority_score), 2),
        "new_score": round(float(new_result.priority_score), 2),
        "score_delta": score_delta,
        "previous_level": previous_level,
        "new_level": new_level,
        "changed_features": changed_features,
        "new_reasons": new_reasons,
        "model_version": previous_result.model_version,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }

    PRIORITY_HISTORY.add_event(updated_zone.zone_id, result)
    return result


def get_zone_history(zone_id: str) -> list[dict[str, Any]]:
    """Return in-memory reprioritization history for a single zone."""
    return PRIORITY_HISTORY.get_history(zone_id)
