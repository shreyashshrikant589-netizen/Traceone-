"""Schemas for deterministic suspicious-report review signals."""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class ReviewAction(str, Enum):
    NONE = "NONE"
    REVIEW = "REVIEW"


class SuspiciousReportInput(BaseModel):
    report_id: str = Field(..., min_length=1)
    case_id: str = Field(..., min_length=1)
    reporter_id: str | None = None
    text: str = Field(..., min_length=1)
    source: str = Field(..., min_length=1)
    latitude: float | None = None
    longitude: float | None = None
    reported_at: datetime
    evidence_ids: list[str] = Field(default_factory=list)
    attachment_hashes: list[str] = Field(default_factory=list)
    previous_report_count: int = Field(default=0, ge=0)
    previous_flagged_report_count: int = Field(default=0, ge=0)
    corroborating_report_count: int = Field(default=0, ge=0)
    metadata: dict[str, object] = Field(default_factory=dict)


class DuplicateReportResult(BaseModel):
    duplicate_detected: bool
    similarity_score: float = Field(..., ge=0.0, le=1.0)
    matched_report_ids: list[str] = Field(default_factory=list)
    flags: list[str] = Field(default_factory=list)
    reasons: list[str] = Field(default_factory=list)


class ConsistencyResult(BaseModel):
    consistency_ok: bool
    flags: list[str] = Field(default_factory=list)
    reasons: list[str] = Field(default_factory=list)


class SuspiciousReportResult(BaseModel):
    report_id: str
    case_id: str
    suspiciousness_score: float = Field(..., ge=0.0, le=100.0)
    risk_level: RiskLevel
    flags: list[str] = Field(default_factory=list)
    reasons: list[str] = Field(default_factory=list)
    review_recommended: bool
    action: ReviewAction
    model_version: str = "anomaly-mvp-0.1"
    generated_at: datetime