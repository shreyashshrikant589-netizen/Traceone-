from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from backend.schemas.common import CasePriority, CaseStatus


class CaseCreate(BaseModel):
    case_number: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=240)
    description: str | None = None
    status: CaseStatus = CaseStatus.DRAFT
    priority: CasePriority = CasePriority.MEDIUM
    event_name: str | None = None
    venue_name: str | None = None
    last_seen_at: datetime | None = None
    known_destination: str | None = None
    initial_radius_m: float | None = Field(default=None, ge=0)
    current_radius_m: float | None = Field(default=None, ge=0)
    appearance: dict | None = None
    photo_url: str | None = None

    @field_validator("last_seen_at", mode="before")
    @classmethod
    def parse_last_seen_at(cls, value: object) -> datetime | None:
        if not value:
            return None
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace("Z", "+00:00"))
            except ValueError:
                from datetime import timezone
                return datetime.now(timezone.utc)
        return None


class CaseUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=240)
    description: str | None = None
    status: CaseStatus | None = None
    priority: CasePriority | None = None
    event_name: str | None = None
    venue_name: str | None = None
    last_seen_at: datetime | None = None
    known_destination: str | None = None
    initial_radius_m: float | None = Field(default=None, ge=0)
    current_radius_m: float | None = Field(default=None, ge=0)


class CaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    case_number: str
    created_by: UUID
    case_manager_id: UUID | None = None
    title: str
    description: str | None = None
    status: str
    priority: str
    event_name: str | None = None
    venue_name: str | None = None
    last_seen_at: datetime | None = None
    known_destination: str | None = None
    initial_radius_m: float | None = None
    current_radius_m: float | None = None
    appearance: dict | None = None
    photo_url: str | None = None
    is_public: bool
    public_at: datetime | None = None
    resolved_at: datetime | None = None
    closed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
