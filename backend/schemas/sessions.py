from datetime import datetime
from enum import StrEnum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class SessionStatus(StrEnum):
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class VerificationStatus(StrEnum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    REJECTED = "REJECTED"


class PointGeometry(BaseModel):
    type: str
    coordinates: list[Any]

    @model_validator(mode="after")
    def validate_point(self) -> "PointGeometry":
        if self.type != "Point" or len(self.coordinates) < 2:
            raise ValueError("Location must be a GeoJSON Point.")
        longitude, latitude = self.coordinates[:2]
        if not isinstance(longitude, (int, float)) or not isinstance(latitude, (int, float)):
            raise ValueError("Point coordinates must be numeric.")
        if not -180 <= longitude <= 180 or not -90 <= latitude <= 90:
            raise ValueError("Point coordinates are outside valid bounds.")
        return self


class SessionCreate(BaseModel):
    start_location: PointGeometry | None = None
    notes: str | None = None


class SessionComplete(BaseModel):
    end_location: PointGeometry | None = None
    notes: str | None = None


class SessionResponse(BaseModel):
    id: UUID
    case_id: UUID
    zone_id: UUID
    volunteer_id: UUID
    status: SessionStatus
    started_at: datetime | None = None
    ended_at: datetime | None = None
    start_location: dict[str, Any] | None = None
    end_location: dict[str, Any] | None = None
    notes: str | None = None
    verification_status: VerificationStatus
    created_at: datetime
    updated_at: datetime
