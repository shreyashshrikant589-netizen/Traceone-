from uuid import UUID

from fastapi import APIRouter, Depends

from backend.dependencies import get_database
from backend.schemas.ai_priorities import AIPriorityResponse
from backend.security.auth import CurrentUser, require_verified_user
from backend.services import ai_priorities
from backend.services.database import Database

router = APIRouter(prefix="/cases/{case_id}/zones", tags=["ai-search-priorities"])


@router.get("/{zone_id}/ai-priority", response_model=AIPriorityResponse)
def get_zone_ai_priority(case_id: UUID, zone_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> AIPriorityResponse:
    return AIPriorityResponse.model_validate(ai_priorities.zone_priority(database, current_user, case_id, zone_id))