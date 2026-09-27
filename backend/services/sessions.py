from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status

from backend.schemas.common import UserRole
from backend.schemas.sessions import SessionComplete, SessionCreate, SessionStatus
from backend.security.auth import CurrentUser, can_manage_case
from backend.services.database import Database, DatabaseError
from backend.services.zones import _active_member, _case, _zone_or_404
from backend.schemas.timeline import TimelineEventType
from backend.schemas.notifications import NotificationType
from backend.services.timeline import create_timeline_event
from backend.services.notifications import notify_active_members


def _db_error(error: DatabaseError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database operation failed.")


def _verified_active(current_user: CurrentUser) -> None:
    if not current_user.profile.get("is_active", False) or not current_user.profile.get("is_verified", False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Active verified account required.")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _manager_or_member(database: Database, current_user: CurrentUser, case_id: UUID, case: dict) -> bool:
    return can_manage_case(current_user, case) or _active_member(database, case_id, current_user.profile_id)


def _session_access(database: Database, current_user: CurrentUser, case_id: UUID, session: dict, case: dict) -> bool:
    return can_manage_case(current_user, case) or str(session.get("volunteer_id")) == str(current_user.profile_id) or _active_member(database, case_id, current_user.profile_id)


def _session_or_404(database: Database, case_id: UUID, session_id: UUID) -> dict:
    session = database.session_by_id(str(case_id), str(session_id))
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Search session not found.")
    return session


def start_session(database: Database, current_user: CurrentUser, case_id: UUID, zone_id: UUID, payload: SessionCreate) -> dict:
    try:
        _verified_active(current_user)
        case = _case(database, case_id)
        zone = _zone_or_404(database, case_id, zone_id)
        manages = can_manage_case(current_user, case)
        if not _manager_or_member(database, current_user, case_id, case):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to start a search.")
        if zone.get("status") == "SEARCHED":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This zone has already been searched.")
        if current_user.role == UserRole.VOLUNTEER and str(zone.get("assigned_volunteer_id")) != str(current_user.profile_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not assigned to this zone.")
        if current_user.role == UserRole.VOLUNTEER or manages:
            existing = database.list_sessions(str(case_id), zone_id=str(zone_id), volunteer_id=str(current_user.profile_id))
            if any(row.get("status") in {"ACTIVE", "PAUSED"} for row in existing):
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You already have an active session for this zone.")
        values = {
            "case_id": str(case_id),
            "zone_id": str(zone_id),
            "volunteer_id": str(current_user.profile_id),
            "status": SessionStatus.ACTIVE.value,
            "started_at": _now(),
            "start_location": payload.start_location.model_dump() if payload.start_location else None,
            "notes": payload.notes,
            "verification_status": "PENDING",
        }
        session = database.create_session(values)
        if current_user.role == UserRole.VOLUNTEER:
            database.update_zone(str(case_id), str(zone_id), {"status": "IN_PROGRESS"})
        create_timeline_event(database, case_id, TimelineEventType.SEARCH_STARTED, current_user.profile_id, "Search session started.", {"session_id": str(session["id"]), "zone_id": str(zone_id)})
        return session
    except DatabaseError as error:
        raise _db_error(error) from error


def list_my_active(database: Database, current_user: CurrentUser, case_id: UUID) -> list[dict]:
    try:
        _verified_active(current_user)
        case = _case(database, case_id)
        if not _manager_or_member(database, current_user, case_id, case):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to view sessions.")
        return [row for row in database.list_sessions(str(case_id), volunteer_id=str(current_user.profile_id)) if row.get("status") in {"ACTIVE", "PAUSED"}]
    except DatabaseError as error:
        raise _db_error(error) from error


def list_case_sessions(database: Database, current_user: CurrentUser, case_id: UUID, zone_id: UUID | None, volunteer_id: UUID | None, session_status: SessionStatus | None) -> list[dict]:
    try:
        _verified_active(current_user)
        case = _case(database, case_id)
        if not _manager_or_member(database, current_user, case_id, case):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to view sessions.")
        return database.list_sessions(str(case_id), str(zone_id) if zone_id else None, str(volunteer_id) if volunteer_id else None, session_status.value if session_status else None)
    except DatabaseError as error:
        raise _db_error(error) from error


def get_session(database: Database, current_user: CurrentUser, case_id: UUID, session_id: UUID) -> dict:
    try:
        _verified_active(current_user)
        case = _case(database, case_id)
        session = _session_or_404(database, case_id, session_id)
        if not _session_access(database, current_user, case_id, session, case):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to view this session.")
        return session
    except DatabaseError as error:
        raise _db_error(error) from error


def transition(database: Database, current_user: CurrentUser, case_id: UUID, session_id: UUID, target: SessionStatus, completion: SessionComplete | None = None) -> dict:
    try:
        _verified_active(current_user)
        case = _case(database, case_id)
        session = _session_or_404(database, case_id, session_id)
        if not (can_manage_case(current_user, case) or str(session.get("volunteer_id")) == str(current_user.profile_id)):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to update this session.")
        current_status = session.get("status")
        allowed = {"PAUSED": {"ACTIVE"}, "ACTIVE": {"PAUSED", "COMPLETED", "CANCELLED"}, "COMPLETED": set(), "CANCELLED": set()}
        if target.value not in allowed.get(current_status, set()):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Cannot change session from {current_status} to {target.value}.")
        values = {"status": target.value}
        if target in {SessionStatus.COMPLETED, SessionStatus.CANCELLED}:
            values["ended_at"] = _now()
        if completion and completion.end_location:
            values["end_location"] = completion.end_location.model_dump()
        if completion and completion.notes is not None:
            values["notes"] = completion.notes
        updated = database.update_session(str(session_id), values)
        if target == SessionStatus.COMPLETED:
            create_timeline_event(database, case_id, TimelineEventType.SEARCH_COMPLETED, UUID(str(session["volunteer_id"])), "Search session completed.", {"session_id": str(session_id), "zone_id": str(session["zone_id"])})
        if target == SessionStatus.COMPLETED and database.count_active_zone_sessions(str(case_id), str(session["zone_id"])) == 0:
            zone = _zone_or_404(database, case_id, UUID(str(session["zone_id"])))
            if zone.get("status") != "SEARCHED":
                database.update_zone(str(case_id), str(session["zone_id"]), {"status": "SEARCHED"})
                notify_active_members(database, case_id, NotificationType.ZONE_COMPLETED, "Search Zone Completed", "A search zone has been completed.", {"zone_id": str(session["zone_id"])})
        return updated
    except DatabaseError as error:
        raise _db_error(error) from error
