"""Schemas for deterministic, reviewable volunteer allocation."""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class VolunteerStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    BUSY = "BUSY"
    OFFLINE = "OFFLINE"
    UNAVAILABLE = "UNAVAILABLE"


class ZoneStatus(str, Enum):
    UNSEARCHED = "UNSEARCHED"
    IN_PROGRESS = "IN_PROGRESS"
    SEARCHED = "SEARCHED"
    REOPENED = "REOPENED"


class VolunteerInput(BaseModel):
    volunteer_id: str = Field(..., min_length=1)
    latitude: float | None = None
    longitude: float | None = None
    available: bool
    current_assignment_count: int = Field(default=0, ge=0)
    max_capacity: int = Field(default=1, ge=0)
    current_zone_id: str | None = None
    skills: list[str] = Field(default_factory=list)
    status: VolunteerStatus = VolunteerStatus.AVAILABLE


class ZoneInput(BaseModel):
    zone_id: str = Field(..., min_length=1)
    priority_score: float = Field(..., ge=0.0, le=100.0)
    latitude: float | None = None
    longitude: float | None = None
    required_volunteers: int = Field(..., gt=0)
    coverage_percent: float = Field(..., ge=0.0, le=100.0)
    status: ZoneStatus = ZoneStatus.UNSEARCHED
    required_skills: list[str] = Field(default_factory=list)


class VolunteerAssignment(BaseModel):
    assignment_id: str
    volunteer_id: str
    zone_id: str
    allocation_score: float = Field(..., ge=0.0, le=100.0)
    distance_km: float | None = Field(default=None, ge=0.0)
    reason: str = Field(..., min_length=1)
    requires_review: bool = True


class AllocationResult(BaseModel):
    assignments: list[VolunteerAssignment] = Field(default_factory=list)
    unassigned_volunteers: list[str] = Field(default_factory=list)
    unfilled_zones: list[str] = Field(default_factory=list)
    model_version: str = "allocation-mvp-0.1"
    generated_at: datetime
    algorithm: str = "greedy"