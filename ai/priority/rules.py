"""Transparent heuristic scoring for the Search Priority Engine MVP.

This module intentionally implements explainable, prototype-weighted scoring. These are not
statistically validated probabilities or learned model coefficients.
"""

from __future__ import annotations

from typing import Any

from ai.priority.features import SearchZoneInput, build_feature_vector


PRIORITY_LEVELS = {
    "LOW": 0,
    "MEDIUM": 40,
    "HIGH": 70,
    "CRITICAL": 85,
}


def calculate_priority_score(features: dict[str, Any]) -> float:
    """Calculate a 0-100 search priority score using prototype heuristic weights.

    The weights below are intentionally transparent and simple. They are selected for explainable
    MVP behavior, not for real-world probability calibration.
    """

    score = 0.0
    score += features["recent_sighting_score"] * 25.0
    score += features["witness_score"] * 15.0
    score += features["direction_score"] * 12.0
    score += features["destination_score"] * 10.0
    score += features["crowd_flow_score"] * 8.0
    score += features["exit_score"] * 8.0
    score += features["transport_score"] * 7.0
    score += features["connectivity_score"] * 6.0
    score += features["distance_score"] * 6.0
    score += features["time_score"] * 3.0

    score -= features["coverage_score"] * 25.0
    score -= features["reopened_penalty"] * 10.0

    # Keep score bounded and human-readable.
    score = max(0.0, min(100.0, score))
    return round(score, 2)


def get_priority_level(priority_score: float) -> str:
    """Map the numeric score to a simple priority level."""
    if priority_score >= PRIORITY_LEVELS["CRITICAL"]:
        return "CRITICAL"
    if priority_score >= PRIORITY_LEVELS["HIGH"]:
        return "HIGH"
    if priority_score >= PRIORITY_LEVELS["MEDIUM"]:
        return "MEDIUM"
    return "LOW"


def generate_reasons(zone: SearchZoneInput, features: dict[str, Any], score: float) -> list[str]:
    """Return deterministic, human-readable reasons for the score."""
    reasons: list[str] = []

    if zone.recent_sighting_count > 0:
        reasons.append(
            "Recent sighting evidence increases search priority."
        )
    if zone.witness_count > 0:
        reasons.append("Witness reports support a higher search priority.")
    if zone.direction_match > 0.6:
        reasons.append("Direction match aligns with likely movement patterns.")
    if zone.destination_match > 0.6:
        reasons.append("Destination match supports the zone as a plausible target area.")
    if zone.crowd_flow_score > 0.6:
        reasons.append("Crowd flow signals indicate the area is relevant to the search context.")
    if zone.exit_distance <= 2.0:
        reasons.append("Proximity to exits raises the value of the zone for search planning.")
    if zone.transport_proximity > 0.5:
        reasons.append("Transport proximity strengthens the case for higher search priority.")
    if zone.connectivity_score > 0.6:
        reasons.append("Area connectivity supports the zone as a likely travel corridor.")
    if zone.coverage_percent > 60:
        reasons.append("High prior coverage lowers the score because the zone has already been searched heavily.")
    if zone.zone_reopened:
        reasons.append("The zone was reopened, which reduces confidence and reduces peak priority.")

    if not reasons:
        reasons.append("The zone has limited evidence and therefore remains at a low priority baseline.")

    if score >= 85:
        reasons.insert(0, "This zone meets a strong evidence-based priority threshold for human review.")
    elif score >= 70:
        reasons.insert(0, "This zone has a meaningful evidence signal and merits higher search attention.")
    elif score >= 40:
        reasons.insert(0, "This zone is moderately relevant and should be reviewed with context.")
    else:
        reasons.insert(0, "This zone is low-priority based on the current heuristic evidence profile.")

    return reasons


def build_explanations(zone: SearchZoneInput, features: dict[str, Any], score: float) -> dict[str, float]:
    """Return a deterministic mapping of feature -> contribution score."""
    contributions = {
        "recent_sighting_count": features["recent_sighting_score"] * 25.0,
        "witness_count": features["witness_score"] * 15.0,
        "direction_match": features["direction_score"] * 12.0,
        "destination_match": features["destination_score"] * 10.0,
        "crowd_flow_score": features["crowd_flow_score"] * 8.0,
        "exit_distance": features["exit_score"] * 8.0,
        "transport_proximity": features["transport_score"] * 7.0,
        "connectivity_score": features["connectivity_score"] * 6.0,
        "distance_km": features["distance_score"] * 6.0,
        "time_elapsed_min": features["time_score"] * 3.0,
        "coverage_percent": -(features["coverage_score"] * 25.0),
        "zone_reopened": -(features["reopened_penalty"] * 10.0),
    }
    return {key: round(value, 2) for key, value in contributions.items()}


def evaluate_zone(zone: SearchZoneInput) -> dict[str, Any]:
    """Return the scoring result for a single zone."""
    features = build_feature_vector(zone)
    score = calculate_priority_score(features)
    level = get_priority_level(score)
    explanations = build_explanations(zone, features, score)
    reasons = generate_reasons(zone, features, score)

    return {
        "priority_score": score,
        "priority_level": level,
        "reason_list": reasons,
        "feature_contributions": explanations,
    }
