from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class CaseSettingsResponse(BaseModel):
    id: UUID
    case_id: UUID
    allow_public_escalation: bool
    allow_public_sightings: bool
    allow_location_sharing: bool
    allow_photo_reports: bool
    auto_expire_publication: bool
    retention_days: int
    created_at: datetime
    updated_at: datetime


class CaseSettingsUpdate(BaseModel):
    allow_public_escalation: bool | None = None
    allow_public_sightings: bool | None = None
    allow_location_sharing: bool | None = None
    allow_photo_reports: bool | None = None
    auto_expire_publication: bool | None = None
    retention_days: int | None = Field(default=None, gt=0, le=3650)


class EscalationRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=2000)


class PublicCaseResponse(BaseModel):
    id: UUID
    case_number: str
    title: str
    description: str | None = None
    event_name: str | None = None
    venue_name: str | None = None
    last_seen_at: datetime | None = None
    last_seen_location: dict | None = None
    priority: str
    public_at: datetime | None = None
    allow_public_sightings: bool
    allow_photo_reports: bool


class PublicStatusResponse(BaseModel):
    is_public: bool
    publication_status: str | None = None
    scope: str | None = None
    public_at: datetime | None = None
    expires_at: datetime | None = None
    status: str