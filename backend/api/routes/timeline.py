from uuid import UUID

from fastapi import APIRouter, Depends, Query

from backend.dependencies import get_database
from backend.schemas.timeline import TimelineResponse
from backend.security.auth import CurrentUser, require_active_user
from backend.services import cases
from backend.services.database import Database, DatabaseError
from fastapi import HTTPException, status

router = APIRouter(prefix="/cases/{case_id}/timeline", tags=["timeline"])


@router.get("", response_model=list[TimelineResponse])
def list_timeline(case_id: UUID, limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0), current_user: CurrentUser = Depends(require_active_user), database: Database = Depends(get_database)) -> list[TimelineResponse]:
    cases.get_case(database, current_user, case_id)
    try:
        return [TimelineResponse.model_validate(row) for row in database.list_timeline(str(case_id), limit, offset)]
    except DatabaseError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Timeline unavailable.") from error
