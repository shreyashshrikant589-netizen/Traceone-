"""Pydantic schemas for the possible-match computer-vision MVP."""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class MatchStatus(str, Enum):
    NO_MATCH = "NO_MATCH"
    LOW_SIMILARITY = "LOW_SIMILARITY"
    POSSIBLE_MATCH = "POSSIBLE_MATCH"
    HIGH_SIMILARITY_REVIEW = "HIGH_SIMILARITY_REVIEW"
    QUALITY_REJECTED = "QUALITY_REJECTED"
    NO_FACE_DETECTED = "NO_FACE_DETECTED"


class FaceBoundingBox(BaseModel):
    x: int = Field(..., ge=0)
    y: int = Field(..., ge=0)
    width: int = Field(..., gt=0)
    height: int = Field(..., gt=0)


class FaceDetection(BaseModel):
    face_id: str = Field(..., min_length=1)
    bounding_box: FaceBoundingBox
    confidence: float = Field(..., ge=0.0, le=1.0)


class ImageQualityResult(BaseModel):
    is_acceptable: bool
    width: int = Field(..., ge=0)
    height: int = Field(..., ge=0)
    quality_score: float = Field(..., ge=0.0, le=1.0)
    issues: list[str] = Field(default_factory=list)


class PossibleMatchCandidate(BaseModel):
    candidate_face_id: str
    similarity_score: float = Field(..., ge=0.0, le=1.0)
    status: MatchStatus
    requires_human_verification: bool = True


class PossibleMatchResult(BaseModel):
    status: MatchStatus
    similarity_score: float = Field(default=0.0, ge=0.0, le=1.0)
    reference_face_id: str | None = None
    candidate_face_id: str | None = None
    candidates: list[PossibleMatchCandidate] = Field(default_factory=list)
    requires_human_verification: bool = True
    explanation: str
    model_version: str = "vision-mvp-0.1"
    reference_quality: ImageQualityResult | None = None
    candidate_quality: ImageQualityResult | None = None