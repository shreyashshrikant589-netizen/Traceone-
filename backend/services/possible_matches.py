from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status

from backend.schemas.common import UserRole
from backend.schemas.notifications import NotificationType
from backend.schemas.possible_matches import PossibleMatchCreate, PossibleMatchReview, PossibleMatchStatus
from backend.schemas.timeline import TimelineEventType
from backend.security.auth import CurrentUser, can_manage_case
from backend.services.database import Database, DatabaseError
from backend.services.notifications import notify_active_members, notify_case_managers
from backend.services.photo_match import PhotoMatchService, safe_analyze
from backend.services.timeline import create_timeline_event


def _db_error(error: DatabaseError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database operation failed.")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _case(database: Database, case_id: UUID) -> dict:
    case = database.case_by_id(str(case_id))
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")
    return case


def _active_member(database: Database, case_id: UUID, profile_id: UUID) -> bool:
    return any(str(row.get("case_id")) == str(case_id) and str(row.get("user_id")) == str(profile_id) and row.get("status") == "ACTIVE" and row.get("left_at") is None for row in database.list_case_memberships_for_user(str(profile_id)))


def _submit_access(database: Database, current_user: CurrentUser, case_id: UUID, case: dict) -> None:
    if not current_user.profile.get("is_active", False) or not current_user.profile.get("is_verified", False):
        raise HTTPException(status_code=403, detail="Active verified account required.")
    if current_user.role not in {UserRole.VOLUNTEER, UserRole.CASE_MANAGER, UserRole.SUPER_ADMIN}:
        raise HTTPException(status_code=403, detail="Only an authorized case participant can submit a possible match.")
    if not (can_manage_case(current_user, case) or _active_member(database, case_id, current_user.profile_id)):
        raise HTTPException(status_code=403, detail="You are not an active member of this case.")


def _read_access(database: Database, current_user: CurrentUser, case_id: UUID, case: dict) -> None:
    if not current_user.profile.get("is_active", False) or not current_user.profile.get("is_verified", False):
        raise HTTPException(status_code=403, detail="Active verified account required.")
    if not (current_user.role == UserRole.SUPER_ADMIN or can_manage_case(current_user, case) or _active_member(database, case_id, current_user.profile_id)):
        raise HTTPException(status_code=403, detail="You are not authorized to view possible matches.")


def _review_access(current_user: CurrentUser, case: dict) -> None:
    if not current_user.profile.get("is_active", False) or not current_user.profile.get("is_verified", False) or not can_manage_case(current_user, case):
        raise HTTPException(status_code=403, detail="Only an authorized case manager can review possible matches.")


def _match(database: Database, case_id: UUID, match_id: UUID) -> dict:
    match = database.possible_match_by_id(str(case_id), str(match_id))
    if not match:
        raise HTTPException(status_code=404, detail="Possible match not found.")
    return match


def submit(database: Database, current_user: CurrentUser, case_id: UUID, payload: PossibleMatchCreate, matcher: PhotoMatchService | None = None) -> dict:
    try:
        case = _case(database, case_id)
        _submit_access(database, current_user, case_id, case)
        source_image_url = database.missing_person_photo_by_case(str(case_id))
        if not source_image_url:
            raise HTTPException(status_code=422, detail="This case has no missing-person source photo.")
        candidate_image_url = str(payload.candidate_image_url)
        result = safe_analyze(matcher or PhotoMatchService(), source_image_url, candidate_image_url)
        values = {"case_id": str(case_id), "reported_by": str(current_user.profile_id), "source_image_url": source_image_url, "candidate_image_url": candidate_image_url, "similarity_score": result.similarity_score, "model_version": result.model_version, "status": PossibleMatchStatus.PENDING.value if result.available else PossibleMatchStatus.REVIEW_REQUIRED.value, "reviewed_by": None, "reviewed_at": None}
        created = database.create_possible_match(values)
        create_timeline_event(database, case_id, TimelineEventType.POSSIBLE_MATCH, current_user.profile_id, "Possible match candidate submitted for review.", {"match_id": str(created["id"]), "status": created["status"]})
        notify_case_managers(database, case, case_id, NotificationType.POSSIBLE_MATCH, "Possible Match Submitted", "A possible match candidate was submitted for human review.", {"match_id": str(created["id"]), "status": created["status"]})
        return created
    except DatabaseError as error:
        raise _db_error(error) from error


def list_matches(database: Database, current_user: CurrentUser, case_id: UUID) -> list[dict]:
    try:
        case = _case(database, case_id)
        _read_access(database, current_user, case_id, case)
        return database.list_possible_matches(str(case_id))
    except DatabaseError as error:
        raise _db_error(error) from error


def get_match(database: Database, current_user: CurrentUser, case_id: UUID, match_id: UUID) -> dict:
    try:
        case = _case(database, case_id)
        _read_access(database, current_user, case_id, case)
        return _match(database, case_id, match_id)
    except DatabaseError as error:
        raise _db_error(error) from error


def review(database: Database, current_user: CurrentUser, case_id: UUID, match_id: UUID, payload: PossibleMatchReview) -> dict:
    try:
        case = _case(database, case_id)
        _review_access(current_user, case)
        if payload.decision not in {PossibleMatchStatus.CONFIRMED, PossibleMatchStatus.REJECTED}:
            raise HTTPException(status_code=422, detail="Review decision must be CONFIRMED or REJECTED.")
        match = _match(database, case_id, match_id)
        if match.get("status") not in {PossibleMatchStatus.PENDING.value, PossibleMatchStatus.REVIEW_REQUIRED.value}:
            raise HTTPException(status_code=409, detail="This possible match has already been reviewed.")
        updated = database.update_possible_match(str(case_id), str(match_id), {"status": payload.decision.value, "reviewed_by": str(current_user.profile_id), "reviewed_at": _now()})
        description = f"Possible match {payload.decision.value.lower()} by authorized reviewer."
        create_timeline_event(database, case_id, TimelineEventType.POSSIBLE_MATCH, current_user.profile_id, description, {"match_id": str(match_id), "status": payload.decision.value})
        notify_active_members(database, case_id, NotificationType.POSSIBLE_MATCH, "Possible Match Reviewed", f"A possible match was {payload.decision.value.lower()} after human review.", {"match_id": str(match_id), "status": payload.decision.value})
        notify_case_managers(database, case, case_id, NotificationType.POSSIBLE_MATCH, "Possible Match Reviewed", f"A possible match was {payload.decision.value.lower()} after human review.", {"match_id": str(match_id), "status": payload.decision.value})
        return updated
    except DatabaseError as error:
        raise _db_error(error) from error