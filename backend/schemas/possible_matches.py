from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import AnyHttpUrl, BaseModel


class PossibleMatchStatus(StrEnum):
    PENDING = "PENDING"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    CONFIRMED = "CONFIRMED"
    REJECTED = "REJECTED"


class PossibleMatchCreate(BaseModel):
    candidate_image_url: AnyHttpUrl


class PossibleMatchReview(BaseModel):
    decision: PossibleMatchStatus


class PossibleMatchResponse(BaseModel):
    id: UUID
    case_id: UUID
    reported_by: UUID
    source_image_url: AnyHttpUrl
    candidate_image_url: AnyHttpUrl
    similarity_score: float | None = None
    model_version: str | None = None
    status: PossibleMatchStatus
    reviewed_by: UUID | None = None
    reviewed_at: datetime | None = None
    created_at: datetime