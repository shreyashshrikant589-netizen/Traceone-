from uuid import UUID

from fastapi import APIRouter, Depends

from backend.dependencies import get_database
from backend.schemas.ai_priorities import AIPriorityResponse
from backend.security.auth import CurrentUser, require_verified_user
from backend.services import ai_priorities
from backend.services.database import Database

router = APIRouter(prefix="/cases/{case_id}/ai", tags=["ai-search-priorities"])


@router.post("/search-priorities/recalculate", response_model=list[AIPriorityResponse])
def recalculate_search_priorities(case_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> list[AIPriorityResponse]:
    return [AIPriorityResponse.model_validate(row) for row in ai_priorities.recalculate(database, current_user, case_id)]


@router.get("/search-priorities", response_model=list[AIPriorityResponse])
def list_search_priorities(case_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> list[AIPriorityResponse]:
    return [AIPriorityResponse.model_validate(row) for row in ai_priorities.list_priorities(database, current_user, case_id)]