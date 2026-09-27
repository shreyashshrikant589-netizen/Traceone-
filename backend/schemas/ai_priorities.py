from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class AIPriorityResponse(BaseModel):
    id: UUID
    case_id: UUID
    zone_id: UUID
    model_version: str
    priority_score: float
    rank: int
    confidence: float
    distance_score: float
    time_score: float
    crowd_score: float
    exit_score: float
    witness_score: float
    coverage_score: float
    direction_score: float
    destination_score: float
    explanation: str
    created_at: datetime