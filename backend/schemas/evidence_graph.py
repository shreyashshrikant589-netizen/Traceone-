from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class EvidenceGraphNodeResponse(BaseModel):
    id: UUID
    node_type: str
    reference_id: UUID | None = None
    location: dict[str, Any] | None = None
    timestamp: datetime | None = None
    description: str | None = None
    confidence: float


class EvidenceGraphEdgeResponse(BaseModel):
    id: UUID
    source_node_id: UUID
    target_node_id: UUID
    relationship_type: str
    weight: float
    confidence: float


class EvidenceGraphResponse(BaseModel):
    nodes: list[EvidenceGraphNodeResponse]
    edges: list[EvidenceGraphEdgeResponse]


class EvidenceGraphNodeDetailResponse(EvidenceGraphNodeResponse):
    connected_edges: list[EvidenceGraphEdgeResponse]


class SupportingEvidenceResponse(BaseModel):
    node_type: str
    description: str | None = None
    confidence: float


class ZoneExplanationResponse(BaseModel):
    zone_id: UUID
    priority_score: float
    confidence: float
    model_version: str
    explanation: str
    supporting_evidence: list[SupportingEvidenceResponse]