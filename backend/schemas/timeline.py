from datetime import datetime
from enum import StrEnum
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class TimelineEventType(StrEnum):
    CASE_CREATED = "CASE_CREATED"
    VOLUNTEER_JOINED = "VOLUNTEER_JOINED"
    ZONE_ASSIGNED = "ZONE_ASSIGNED"
    SEARCH_STARTED = "SEARCH_STARTED"
    SEARCH_COMPLETED = "SEARCH_COMPLETED"
    EVIDENCE_ADDED = "EVIDENCE_ADDED"
    SIGHTING_REPORTED = "SIGHTING_REPORTED"
    AI_PRIORITY_UPDATED = "AI_PRIORITY_UPDATED"
    CASE_ESCALATED = "CASE_ESCALATED"
    PUBLIC_SEARCH_STARTED = "PUBLIC_SEARCH_STARTED"
    POLICE_NOTIFIED = "POLICE_NOTIFIED"
    POSSIBLE_MATCH = "POSSIBLE_MATCH"
    CASE_RESOLVED = "CASE_RESOLVED"
    CASE_CLOSED = "CASE_CLOSED"


class TimelineResponse(BaseModel):
    id: UUID
    case_id: UUID
    actor_id: UUID | None = None
    event_type: TimelineEventType
    description: str | None = None
    metadata: dict[str, Any]
    created_at: datetime
