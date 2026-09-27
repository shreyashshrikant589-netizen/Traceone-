from datetime import datetime
from enum import StrEnum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from backend.schemas.sessions import PointGeometry


class ReportStatus(StrEnum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    SUSPICIOUS = "SUSPICIOUS"
    REJECTED = "REJECTED"
    RESOLVED = "RESOLVED"


class WitnessStatus(StrEnum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    SUSPICIOUS = "SUSPICIOUS"
    REJECTED = "REJECTED"


class EvidenceStatus(StrEnum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    SUSPICIOUS = "SUSPICIOUS"
    REJECTED = "REJECTED"


class EvidenceType(StrEnum):
    LAST_SEEN = "LAST_SEEN"
    WITNESS = "WITNESS"
    SIGHTING = "SIGHTING"
    OBSERVATION = "OBSERVATION"
    DIRECTION = "DIRECTION"
    CROWD_FLOW = "CROWD_FLOW"
    SEARCH_RESULT = "SEARCH_RESULT"
    EXIT = "EXIT"
    OTHER = "OTHER"


class ReportCreate(BaseModel):
    report_type: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=5000)
    location: PointGeometry | None = None


class ReportReview(BaseModel):
    status: ReportStatus


class WitnessCreate(BaseModel):
    description: str | None = Field(default=None, max_length=5000)
    observed_at: datetime | None = None
    location: PointGeometry | None = None
    person_description: str | None = Field(default=None, max_length=3000)
    direction: str | None = Field(default=None, max_length=500)
    clothing: str | None = Field(default=None, max_length=2000)
    confidence: float | None = Field(default=None, ge=0, le=1)


class WitnessReview(BaseModel):
    status: WitnessStatus


class EvidenceCreate(BaseModel):
    evidence_type: EvidenceType
    description: str | None = Field(default=None, max_length=5000)
    location: PointGeometry | None = None
    occurred_at: datetime | None = None
    confidence: float | None = Field(default=None, ge=0, le=1)
    source: str | None = Field(default=None, max_length=500)
    photo_url: str | None = Field(default=None, max_length=2000)


class EvidenceReview(BaseModel):
    status: EvidenceStatus


class ReportResponse(BaseModel):
    id: UUID
    case_id: UUID
    reporter_id: UUID | None = None
    report_type: str
    description: str | None = None
    location: dict[str, Any] | None = None
    status: ReportStatus
    reviewed_by: UUID | None = None
    reviewed_at: datetime | None = None
    created_at: datetime


class WitnessResponse(BaseModel):
    id: UUID
    case_id: UUID
    evidence_id: UUID | None = None
    reported_by: UUID | None = None
    description: str | None = None
    reported_at: datetime
    observed_at: datetime | None = None
    location: dict[str, Any] | None = None
    person_description: str | None = None
    direction: str | None = None
    clothing: str | None = None
    confidence: float | None = None
    status: WitnessStatus
    created_at: datetime
    updated_at: datetime


class EvidenceResponse(BaseModel):
    id: UUID
    case_id: UUID
    submitted_by: UUID | None = None
    evidence_type: EvidenceType
    description: str | None = None
    location: dict[str, Any] | None = None
    occurred_at: datetime | None = None
    confidence: float | None = None
    source: str | None = None
    photo_url: str | None = None
    status: EvidenceStatus
    created_at: datetime
    updated_at: datetime
