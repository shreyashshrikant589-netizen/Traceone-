from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, status

from backend.schemas.common import UserRole
from backend.schemas.volunteer_locations import VolunteerLocationCreate
from backend.security.auth import CurrentUser, can_manage_case
from backend.services.database import Database, DatabaseError

MAX_HISTORY_LIMIT = 200
DEFAULT_ACTIVE_MINUTES = 15
MAX_ACTIVE_MINUTES = 60


def _db_error(error: DatabaseError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database operation failed.")


def _case(database: Database, case_id: UUID) -> dict:
    case = database.case_by_id(str(case_id))
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")
    return case


def _active_member(database: Database, case_id: UUID, profile_id: UUID) -> bool:
    return any(str(row.get("case_id")) == str(case_id) and str(row.get("user_id")) == str(profile_id) and row.get("status") == "ACTIVE" and row.get("left_at") is None for row in database.list_case_memberships_for_user(str(profile_id)))


def _session(database: Database, case_id: UUID, session_id: UUID) -> dict:
    session = database.session_by_id(str(case_id), str(session_id))
    if not session:
        raise HTTPException(status_code=404, detail="Search session not found.")
    return session


def _active_verified(current_user: CurrentUser) -> None:
    if not current_user.profile.get("is_active", False) or not current_user.profile.get("is_verified", False):
        raise HTTPException(status_code=403, detail="Active verified account required.")


def _owner(database: Database, current_user: CurrentUser, case_id: UUID, session: dict) -> None:
    _active_verified(current_user)
    if not _active_member(database, case_id, current_user.profile_id):
        raise HTTPException(status_code=403, detail="You are not an active case member.")
    if str(session.get("volunteer_id")) != str(current_user.profile_id):
        raise HTTPException(status_code=403, detail="This search session belongs to another volunteer.")


def _manager(database: Database, current_user: CurrentUser, case_id: UUID, case: dict) -> None:
    _active_verified(current_user)
    if not (current_user.role == UserRole.SUPER_ADMIN or can_manage_case(current_user, case)):
        raise HTTPException(status_code=403, detail="Only an authorized case manager can view these locations.")


def submit(database: Database, current_user: CurrentUser, case_id: UUID, session_id: UUID, payload: VolunteerLocationCreate) -> dict:
    try:
        case = _case(database, case_id)
        session = _session(database, case_id, session_id)
        _owner(database, current_user, case_id, session)
        if session.get("status") != "ACTIVE":
            raise HTTPException(status_code=409, detail="Location updates require an ACTIVE search session.")
        recorded_at = payload.recorded_at.astimezone(timezone.utc).isoformat()
        location = {"type": "Point", "coordinates": [payload.longitude, payload.latitude]}
        previous = database.latest_volunteer_location(str(case_id), str(session_id), str(current_user.profile_id))
        if previous and previous.get("recorded_at") == recorded_at and previous.get("location") == location:
            raise HTTPException(status_code=409, detail="Duplicate location update.")
        return database.create_volunteer_location({"case_id": str(case_id), "volunteer_id": str(current_user.profile_id), "session_id": str(session_id), "location": location, "accuracy_m": payload.accuracy_m, "speed": payload.speed, "heading": payload.heading, "recorded_at": recorded_at})
    except DatabaseError as error:
        raise _db_error(error) from error


def latest(database: Database, current_user: CurrentUser, case_id: UUID, session_id: UUID) -> dict:
    try:
        session = _session(database, case_id, session_id)
        _owner(database, current_user, case_id, session)
        location = database.latest_volunteer_location(str(case_id), str(session_id), str(current_user.profile_id))
        if not location:
            raise HTTPException(status_code=404, detail="Location not found.")
        return location
    except DatabaseError as error:
        raise _db_error(error) from error


def history(database: Database, current_user: CurrentUser, case_id: UUID, session_id: UUID, limit: int) -> list[dict]:
    try:
        case = _case(database, case_id)
        session = _session(database, case_id, session_id)
        if limit < 1 or limit > MAX_HISTORY_LIMIT:
            raise HTTPException(status_code=422, detail=f"limit must be between 1 and {MAX_HISTORY_LIMIT}.")
        if current_user.role == UserRole.SUPER_ADMIN or can_manage_case(current_user, case):
            _active_verified(current_user)
            return database.list_volunteer_locations(str(case_id), [str(session_id)], limit=limit)
        _owner(database, current_user, case_id, session)
        return database.list_volunteer_locations(str(case_id), [str(session_id)], volunteer_id=str(current_user.profile_id), limit=limit)
    except DatabaseError as error:
        raise _db_error(error) from error


def active_locations(database: Database, current_user: CurrentUser, case_id: UUID, minutes: int) -> list[dict]:
    try:
        case = _case(database, case_id)
        _manager(database, current_user, case_id, case)
        if minutes < 1 or minutes > MAX_ACTIVE_MINUTES:
            raise HTTPException(status_code=422, detail=f"minutes must be between 1 and {MAX_ACTIVE_MINUTES}.")
        sessions = database.list_sessions(str(case_id), session_status="ACTIVE")
        session_ids = [str(session["id"]) for session in sessions]
        since = (datetime.now(timezone.utc) - timedelta(minutes=minutes)).isoformat()
        return database.list_volunteer_locations(str(case_id), session_ids, since=since, limit=MAX_HISTORY_LIMIT)
    except DatabaseError as error:
        raise _db_error(error) from error