from uuid import UUID

from fastapi import HTTPException, status

from backend.schemas.common import UserRole
from backend.security.auth import CurrentUser, can_manage_case
from backend.services.database import Database, DatabaseError


def list_members(database: Database, current_user: CurrentUser, case_id: UUID) -> list[dict]:
    try:
        case = database.case_by_id(str(case_id))
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found.")
        if not _can_view_members(database, current_user, case):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found.")
        return database.list_case_members(str(case_id))
    except DatabaseError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database operation failed.") from error


def _can_view_members(database: Database, current_user: CurrentUser, case: dict) -> bool:
    if current_user.role == UserRole.SUPER_ADMIN or can_manage_case(current_user, case):
        return True
    profile_id = str(current_user.profile_id)
    if case.get("is_public"):
        return False
    memberships = database.list_case_memberships_for_user(profile_id)
    return any(
        str(member.get("case_id")) == str(case.get("id"))
        and member.get("status") != "LEFT"
        and member.get("left_at") is None
        for member in memberships
    )
