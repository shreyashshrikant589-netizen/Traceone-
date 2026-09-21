"""Public prediction interface for the Search Priority Engine MVP.

The public function validates inputs, extracts features, scores the zone, generates
explanations, and returns a structured result. The logic is intentionally transparent and
determinstic for a first implementation.
"""

from __future__ import annotations

from datetime import datetime, timezone

from pydantic import BaseModel, Field

from ai.priority.features import SearchZoneInput, build_feature_vector
from ai.priority.model import ACTIVE_MODEL
from ai.priority.rules import evaluate_zone


class SearchPriorityResponse(BaseModel):
    """Structured output for a single zone evaluation."""

    zone_id: str
    priority_score: float = Field(..., ge=0, le=100)
    priority_level: str
    reasons: list[str]
    feature_contributions: dict[str, float]
    model_version: str
    generated_at: str


def predict_search_priority(zone_input: SearchZoneInput | dict[str, object]) -> SearchPriorityResponse:
    """Validate, score, and explain the priority for a search zone.

    This public function is the main entry point for the MVP and is suitable for future
    backend integration when the architecture grows.
    """
    if isinstance(zone_input, dict):
        zone = SearchZoneInput(**zone_input)
    else:
        zone = zone_input

    _ = build_feature_vector(zone)
    result = evaluate_zone(zone)
    response = SearchPriorityResponse(
        zone_id=zone.zone_id,
        priority_score=result["priority_score"],
        priority_level=result["priority_level"],
        reasons=result["reason_list"],
        feature_contributions=result["feature_contributions"],
        model_version=ACTIVE_MODEL.model_version if hasattr(ACTIVE_MODEL, "model_version") else "heuristic-mvp-v1",
        generated_at=datetime.now(timezone.utc).isoformat(),
    )
    return response
