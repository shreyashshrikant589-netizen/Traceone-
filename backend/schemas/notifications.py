from datetime import datetime
from enum import StrEnum
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class NotificationType(StrEnum):
    CASE_PUBLIC = "CASE_PUBLIC"
    NEW_SIGHTING = "NEW_SIGHTING"
    NEW_EVIDENCE = "NEW_EVIDENCE"
    ZONE_ASSIGNED = "ZONE_ASSIGNED"
    ZONE_COMPLETED = "ZONE_COMPLETED"
    HIGH_PRIORITY_ZONE = "HIGH_PRIORITY_ZONE"
    POSSIBLE_MATCH = "POSSIBLE_MATCH"
    SEARCH_EXPANSION = "SEARCH_EXPANSION"
    POLICE_UPDATE = "POLICE_UPDATE"
    CASE_RESOLVED = "CASE_RESOLVED"


class NotificationStatus(StrEnum):
    PENDING = "PENDING"
    SENT = "SENT"
    FAILED = "FAILED"
    READ = "READ"


class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    case_id: UUID | None = None
    type: NotificationType
    title: str
    message: str
    data: dict[str, Any]
    status: NotificationStatus
    sent_at: datetime | None = None
    read_at: datetime | None = None
    created_at: datetime


class UnreadCountResponse(BaseModel):
    count: int
