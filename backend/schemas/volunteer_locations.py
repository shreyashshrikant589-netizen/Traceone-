from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class VolunteerLocationCreate(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    accuracy_m: float | None = Field(default=None, ge=0)
    speed: float | None = Field(default=None, ge=0)
    heading: float | None = Field(default=None, ge=0, lt=360)
    recorded_at: datetime

    @field_validator("recorded_at")
    @classmethod
    def validate_recorded_at(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("recorded_at must include a timezone.")
        if value > datetime.now(timezone.utc).replace(microsecond=0):
            raise ValueError("recorded_at cannot be in the future.")
        return value


class VolunteerLocationResponse(BaseModel):
    id: UUID
    case_id: UUID
    volunteer_id: UUID
    session_id: UUID
    location: dict[str, Any]
    accuracy_m: float | None = None
    speed: float | None = None
    heading: float | None = None
    recorded_at: datetime
    created_at: datetime