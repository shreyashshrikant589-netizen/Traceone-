"""Schemas for deterministic search-radius recommendations."""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class RadiusStage(str, Enum):
    VENUE = "VENUE"
    PERIMETER = "PERIMETER"
    ROADS_EXITS = "ROADS_EXITS"
    TRANSPORT_NODES = "TRANSPORT_NODES"
    WIDER_AREA = "WIDER_AREA"


class SearchRadiusInput(BaseModel):
    time_elapsed_min: float = Field(default=0.0, ge=0.0)
    recent_sighting_count: int = Field(default=0, ge=0)
    direction_match: float = Field(default=0.0, ge=0.0, le=1.0)
    exit_distance: float = Field(default=0.0, ge=0.0)
    coverage_percent: float = Field(default=0.0, ge=0.0, le=100.0)
    destination_match: float = Field(default=0.0, ge=0.0, le=1.0)
    connectivity_score: float = Field(default=0.0, ge=0.0, le=1.0)
    current_radius_km: float = Field(default=0.0, ge=0.0)


class SearchRadiusRecommendation(BaseModel):
    current_stage: RadiusStage
    recommended_radius_km: float = Field(..., ge=0.0)
    next_stage: RadiusStage | None = None
    expansion_score: float = Field(..., ge=0.0, le=100.0)
    confidence: float = Field(..., ge=0.0, le=1.0)
    reasons: list[str] = Field(default_factory=list)
    model_version: str = "radius-mvp-0.1"
