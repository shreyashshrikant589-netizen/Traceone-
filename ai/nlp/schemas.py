"""Pydantic models for witness report inputs and extracted structured evidence."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, field_validator

from ai.graph.model import EvidenceType


class WitnessReportInput(BaseModel):
    """Structured witness report input for deterministic NLP extraction.

    This model captures the original human-written witness narrative and basic metadata.
    It does not treat the statement as confirmed truth; it simply provides a structured
    report for evidence extraction.
    """

    report_id: str = Field(..., min_length=1)
    case_id: str = Field(..., min_length=1)
    zone_id: str | None = None
    text: str = Field(..., min_length=1)
    source: str = Field(..., min_length=1)
    reported_at: datetime
    location: str | None = None

    @field_validator("report_id", "case_id", "source")
    @classmethod
    def validate_required_strings(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("This field cannot be empty.")
        return cleaned

    @field_validator("text")
    @classmethod
    def validate_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Witness report text cannot be empty.")
        return cleaned


class WitnessExtractionResult(BaseModel):
    """Structured extraction produced from a witness statement."""

    report_id: str
    case_id: str
    zone_id: str | None = None
    evidence_type: EvidenceType = EvidenceType.WITNESS
    person_type: str | None = None
    age_hint: str | None = None
    gender_hint: str | None = None
    clothing: list[str] | None = None
    colors: list[str] | None = None
    direction: str | None = None
    location: str | None = None
    destination: str | None = None
    time_reference: str | None = None
    object_hint: str | None = None
    vehicle_hint: str | None = None
    extracted_entities: dict[str, Any] = Field(default_factory=dict)
    extraction_confidence: float = Field(..., ge=0.0, le=1.0)
    source: str
    reported_at: datetime
