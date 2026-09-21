"""Validated evidence model for the TraceOne AI evidence graph foundation."""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, field_validator


class EvidenceType(str, Enum):
    """Supported evidence categories for the initial TraceOne MVP."""

    LAST_SEEN = "LAST_SEEN"
    WITNESS = "WITNESS"
    OBSERVATION = "OBSERVATION"
    DIRECTION = "DIRECTION"
    EXIT = "EXIT"
    CROWD_FLOW = "CROWD_FLOW"
    SEARCH_RESULT = "SEARCH_RESULT"
    SIGHTING = "SIGHTING"


class EvidenceStatus(str, Enum):
    """Evidence review states used in the decision-support workflow."""

    RAW = "RAW"
    PENDING_REVIEW = "PENDING_REVIEW"
    VERIFIED = "VERIFIED"
    SUSPICIOUS = "SUSPICIOUS"
    REJECTED = "REJECTED"


class Evidence(BaseModel):
    """A single evidence item in the TraceOne decision-support graph.

    This model is intentionally explainable and deterministic. It does not assert that a
    piece of evidence proves a location; it only supports human review and feature updates.
    """

    evidence_id: str = Field(..., min_length=1)
    case_id: str = Field(..., min_length=1)
    zone_id: str | None = None
    type: EvidenceType
    location: str = Field(..., min_length=1)
    timestamp: str
    description: str = Field(..., min_length=1)
    confidence: float = Field(..., ge=0.0, le=1.0)
    source: str = Field(..., min_length=1)
    status: EvidenceStatus = EvidenceStatus.RAW

    @field_validator("evidence_id", "case_id", "location", "source")
    @classmethod
    def ensure_non_empty(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("This field cannot be empty.")
        return cleaned

    @field_validator("description")
    @classmethod
    def normalize_description(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Description cannot be empty.")
        return cleaned

    @field_validator("timestamp")
    @classmethod
    def validate_timestamp(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Timestamp cannot be empty.")
        try:
            if normalized.endswith("Z"):
                normalized = normalized[:-1] + "+00:00"
            datetime.fromisoformat(normalized)
        except ValueError as exc:  # pragma: no cover - defensive validation
            raise ValueError("Timestamp must use ISO-8601 format.") from exc
        return value

    def to_dict(self) -> dict[str, object]:
        """Return a serializable dictionary representation of the evidence."""
        return {
            "evidence_id": self.evidence_id,
            "case_id": self.case_id,
            "zone_id": self.zone_id,
            "type": self.type.value,
            "location": self.location,
            "timestamp": self.timestamp,
            "description": self.description,
            "confidence": round(float(self.confidence), 4),
            "source": self.source,
            "status": self.status.value,
        }
