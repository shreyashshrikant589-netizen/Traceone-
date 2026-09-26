from uuid import UUID

from fastapi import APIRouter, Depends

from backend.dependencies import get_database
from backend.schemas.evidence_graph import ZoneExplanationResponse
from backend.security.auth import CurrentUser, require_verified_user
from backend.services import evidence_graph
from backend.services.database import Database

router = APIRouter(prefix="/cases/{case_id}/zones", tags=["ai-explanations"])


@router.get("/{zone_id}/ai-explanation", response_model=ZoneExplanationResponse)
def get_ai_explanation(case_id: UUID, zone_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> ZoneExplanationResponse:
    return ZoneExplanationResponse.model_validate(evidence_graph.explanation(database, current_user, case_id, zone_id))