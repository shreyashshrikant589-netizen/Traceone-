from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel


class PoliceNotificationStatus(StrEnum):
    PENDING = "PENDING"
    NOTIFIED = "NOTIFIED"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    CLOSED = "CLOSED"


class PoliceNotificationResponse(BaseModel):
    id: str
    case_id: UUID
    requested_by: UUID
    status: PoliceNotificationStatus
    reference_id: str
    created_at: datetime
    notified_at: datetime | None = None
    acknowledged_at: datetime | None = None
    closed_at: datetime | None = None