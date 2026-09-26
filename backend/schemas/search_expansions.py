from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel


class ExpansionStage(StrEnum):
    EVENT_AREA = "EVENT_AREA"
    VENUE_PERIMETER = "VENUE_PERIMETER"
    ROADS_EXITS = "ROADS_EXITS"
    TRANSPORT_NODES = "TRANSPORT_NODES"
    WIDER_AREA = "WIDER_AREA"


class ExpansionStatus(StrEnum):
    RECOMMENDED = "RECOMMENDED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"


class SearchExpansionResponse(BaseModel):
    id: UUID
    case_id: UUID
    stage: ExpansionStage
    previous_radius_m: float | None = None
    new_radius_m: float
    reason: str
    recommended_by: UUID
    approved_by: UUID | None = None
    status: ExpansionStatus
    created_at: datetime