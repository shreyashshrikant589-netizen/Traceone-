from uuid import UUID

from fastapi import APIRouter, Depends

from backend.dependencies import get_database
from backend.schemas.members import CaseMemberResponse
from backend.security.auth import CurrentUser, require_active_user
from backend.services import members as member_service
from backend.services.database import Database

router = APIRouter(prefix="/cases/{case_id}/members", tags=["case-members"])


@router.get("", response_model=list[CaseMemberResponse])
def list_case_members(
    case_id: UUID,
    current_user: CurrentUser = Depends(require_active_user),
    database: Database = Depends(get_database),
) -> list[CaseMemberResponse]:
    return [
        CaseMemberResponse.model_validate(member)
        for member in member_service.list_members(database, current_user, case_id)
        if member.get("status") != "REMOVED"
    ]
