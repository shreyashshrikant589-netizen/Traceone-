from uuid import UUID

from fastapi import HTTPException, status

from backend.schemas.cases import CaseCreate, CaseUpdate
from backend.schemas.common import UserRole
from backend.security.auth import CurrentUser, can_manage_case
from backend.services.database import Database, DatabaseError
from backend.schemas.timeline import TimelineEventType
from backend.services.timeline import create_timeline_event
from backend.services.notifications import notify_active_members
from backend.schemas.notifications import NotificationType
from datetime import datetime, timezone


def _handle_database_error(error: DatabaseError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error))


def _active_membership_ids(database: Database, profile_id: UUID) -> set[str]:
    memberships = database.list_case_memberships_for_user(str(profile_id))
    return {
        str(membership["case_id"])
        for membership in memberships
        if membership.get("status") != "LEFT" and membership.get("left_at") is None
    }


def create_case(database: Database, current_user: CurrentUser, payload: CaseCreate) -> dict:
    if current_user.role not in {UserRole.SUPER_ADMIN, UserRole.CASE_MANAGER, UserRole.VOLUNTEER}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Active account required to create cases.")

    values = payload.model_dump(exclude_none=True)
    profile_id = str(current_user.profile_id)
    values["created_by"] = profile_id
    if not values.get("case_manager_id"):
        values["case_manager_id"] = profile_id
    try:
        created = database.create_case(values)
        create_timeline_event(database, UUID(str(created["id"])), TimelineEventType.CASE_CREATED, current_user.profile_id, "Case created.")
        return created
    except DatabaseError as error:
        raise _handle_database_error(error) from error


def list_cases(database: Database, current_user: CurrentUser) -> list[dict]:
    try:
        rows = database.list_cases()
        membership_ids = _active_membership_ids(database, current_user.profile_id)
    except DatabaseError as error:
        raise _handle_database_error(error) from error

    if current_user.role == UserRole.SUPER_ADMIN:
        return rows

    profile_id = str(current_user.profile_id)
    return [
        row for row in rows
        if row.get("is_public")
        or str(row.get("created_by")) == profile_id
        or str(row.get("case_manager_id")) == profile_id
        or str(row.get("id")) in membership_ids
    ]


def get_case(database: Database, current_user: CurrentUser, case_id: UUID) -> dict:
    try:
        row = database.case_by_id(str(case_id))
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found.")
        if not _can_view_case(database, current_user, row):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found.")
        return row
    except DatabaseError as error:
        raise _handle_database_error(error) from error


def update_case(database: Database, current_user: CurrentUser, case_id: UUID, payload: CaseUpdate) -> dict:
    try:
        existing = database.case_by_id(str(case_id))
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found.")
        if not can_manage_case(current_user, existing):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot modify this case.")
        values = payload.model_dump(exclude_none=True)
        if not values:
            return existing
        return database.update_case(str(case_id), values)
    except DatabaseError as error:
        raise _handle_database_error(error) from error


def resolve_case(database: Database, current_user: CurrentUser, case_id: UUID) -> dict:
    try:
        existing = database.case_by_id(str(case_id))
        if not existing:
            raise HTTPException(status_code=404, detail="Case not found.")
        if not current_user.profile.get("is_active") or not current_user.profile.get("is_verified") or not can_manage_case(current_user, existing):
            raise HTTPException(status_code=403, detail="Only an authorized case manager can resolve this case.")
        if existing.get("status") not in {"LOCAL_SEARCH", "LOCAL_SEARCH_COMPLETED", "PUBLIC_SEARCH"}:
            raise HTTPException(status_code=409, detail=f"Cannot resolve case from {existing.get('status')}.")
        resolved_at = datetime.now(timezone.utc).isoformat()
        updated = database.update_case(str(case_id), {"status": "RESOLVED", "resolved_at": resolved_at})
        create_timeline_event(database, case_id, TimelineEventType.CASE_RESOLVED, current_user.profile_id, "Case resolved by authorized case manager.")
        notify_active_members(database, case_id, NotificationType.CASE_RESOLVED, "Case Resolved", "This TraceOne case was marked resolved by an authorized case manager.", {"case_id": str(case_id)})
        return updated
    except DatabaseError as error:
        raise _handle_database_error(error) from error


def close_case(database: Database, current_user: CurrentUser, case_id: UUID) -> dict:
    try:
        existing = database.case_by_id(str(case_id))
        if not existing:
            raise HTTPException(status_code=404, detail="Case not found.")
        if not current_user.profile.get("is_active") or not current_user.profile.get("is_verified") or not can_manage_case(current_user, existing):
            raise HTTPException(status_code=403, detail="Only an authorized case manager can close this case.")
        if existing.get("status") != "RESOLVED":
            raise HTTPException(status_code=409, detail="Only resolved cases can be closed.")
        closed_at = datetime.now(timezone.utc).isoformat()
        updated = database.update_case(str(case_id), {"status": "CLOSED", "closed_at": closed_at})
        create_timeline_event(database, case_id, TimelineEventType.CASE_CLOSED, current_user.profile_id, "Case closed by authorized case manager.")
        notify_active_members(database, case_id, NotificationType.CASE_RESOLVED, "Case Closed", "This TraceOne case was closed after resolution.", {"case_id": str(case_id)})
        return updated
    except DatabaseError as error:
        raise _handle_database_error(error) from error


def _can_view_case(database: Database, current_user: CurrentUser, case: dict) -> bool:
    if current_user.role == UserRole.SUPER_ADMIN or case.get("is_public"):
        return True
    profile_id = str(current_user.profile_id)
    if str(case.get("created_by")) == profile_id or str(case.get("case_manager_id")) == profile_id:
        return True
    return str(case.get("id")) in _active_membership_ids(database, current_user.profile_id)
