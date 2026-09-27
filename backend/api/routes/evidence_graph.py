from uuid import UUID

from fastapi import APIRouter, Depends

from backend.dependencies import get_database
from backend.schemas.evidence_graph import EvidenceGraphNodeDetailResponse, EvidenceGraphResponse, EvidenceGraphNodeResponse, EvidenceGraphEdgeResponse
from backend.security.auth import CurrentUser, require_verified_user
from backend.services import evidence_graph
from backend.services.database import Database

router = APIRouter(prefix="/cases/{case_id}/evidence-graph", tags=["evidence-graph"])


@router.post("/rebuild", response_model=EvidenceGraphResponse)
def rebuild_graph(case_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> EvidenceGraphResponse:
    return EvidenceGraphResponse.model_validate(evidence_graph.rebuild(database, current_user, case_id))


@router.get("", response_model=EvidenceGraphResponse)
def get_graph(case_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> EvidenceGraphResponse:
    return EvidenceGraphResponse.model_validate(evidence_graph.graph(database, current_user, case_id))


@router.get("/nodes/{node_id}", response_model=EvidenceGraphNodeDetailResponse)
def get_graph_node(case_id: UUID, node_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> EvidenceGraphNodeDetailResponse:
    return EvidenceGraphNodeDetailResponse.model_validate(evidence_graph.node(database, current_user, case_id, node_id))