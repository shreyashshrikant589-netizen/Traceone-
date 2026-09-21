"""Feature extraction and normalization for the Search Priority Engine MVP.

This module intentionally keeps the logic simple, deterministic, and explainable.
The extracted values are heuristic features for decision support, not learned model inputs.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, field_validator


class SearchZoneInput(BaseModel):
    """Validated zone-level input for the search priority MVP.

    These fields represent supporting signals that may help human operators decide where to
    search next. The score is a heuristic priority score, not a probability of location.
    """

    zone_id: str = Field(..., min_length=1)
    distance_km: float = Field(..., ge=0)
    time_elapsed_min: float = Field(..., ge=0)
    crowd_density: float = Field(..., ge=0, le=1)
    crowd_flow_score: float = Field(..., ge=0, le=1)
    exit_distance: float = Field(..., ge=0)
    witness_count: int = Field(..., ge=0)
    recent_sighting_count: int = Field(..., ge=0)
    direction_match: float = Field(..., ge=0, le=1)
    destination_match: float = Field(..., ge=0, le=1)
    coverage_percent: float = Field(..., ge=0, le=100)
    connectivity_score: float = Field(..., ge=0, le=1)
    zone_reopened: bool = False
    transport_proximity: float = Field(..., ge=0, le=1)

    @field_validator("distance_km", "time_elapsed_min", "exit_distance")
    @classmethod
    def validate_non_negative(cls, value: float) -> float:
        if value < 0:
            raise ValueError("Value cannot be negative.")
        return value

    @field_validator("witness_count", "recent_sighting_count")
    @classmethod
    def validate_counts(cls, value: int) -> int:
        if value < 0:
            raise ValueError("Counts cannot be negative.")
        return value


def normalize_score(value: float, lower: float = 0.0, upper: float = 1.0) -> float:
    """Clamp a score into a normalized range for consistent heuristics."""
    if value < lower:
        return lower
    if value > upper:
        return upper
    return value


def extract_zone_features(zone: SearchZoneInput) -> dict[str, float | int | bool]:
    """Map validated inputs into deterministic feature values for scoring.

    Each feature is intentionally simple and easy to explain. This module is not meant to hide
    the scoring logic behind learned transformations.
    """

    features: dict[str, float | int | bool] = {
        "distance_km": float(zone.distance_km),
        "time_elapsed_min": float(zone.time_elapsed_min),
        "crowd_density": float(zone.crowd_density),
        "crowd_flow_score": normalize_score(zone.crowd_flow_score),
        "exit_distance": float(zone.exit_distance),
        "witness_count": int(zone.witness_count),
        "recent_sighting_count": int(zone.recent_sighting_count),
        "direction_match": normalize_score(zone.direction_match),
        "destination_match": normalize_score(zone.destination_match),
        "coverage_percent": float(zone.coverage_percent),
        "connectivity_score": normalize_score(zone.connectivity_score),
        "zone_reopened": bool(zone.zone_reopened),
        "transport_proximity": normalize_score(zone.transport_proximity),
    }
    return features


def build_feature_vector(zone: SearchZoneInput) -> dict[str, Any]:
    """Return normalized, explainable heuristic features used by the scoring engine."""
    features = extract_zone_features(zone)
    return {
        "distance_score": 1.0 - min(max(zone.distance_km / 10.0, 0.0), 1.0),
        "time_score": 1.0 - min(max(zone.time_elapsed_min / 240.0, 0.0), 1.0),
        "recent_sighting_score": min(zone.recent_sighting_count / 5.0, 1.0),
        "witness_score": min(zone.witness_count / 5.0, 1.0),
        "direction_score": normalize_score(zone.direction_match),
        "destination_score": normalize_score(zone.destination_match),
        "crowd_flow_score": normalize_score(zone.crowd_flow_score),
        "exit_score": 1.0 - min(max(zone.exit_distance / 10.0, 0.0), 1.0),
        "coverage_score": zone.coverage_percent / 100.0,
        "connectivity_score": normalize_score(zone.connectivity_score),
        "transport_score": normalize_score(zone.transport_proximity),
        "reopened_penalty": 1.0 if zone.zone_reopened else 0.0,
        "crowd_density": normalize_score(zone.crowd_density),
    }
