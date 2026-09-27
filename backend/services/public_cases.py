from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, status

from backend.schemas.common import CaseStatus, UserRole
from backend.schemas.notifications import NotificationType
from backend.schemas.public_cases import CaseSettingsUpdate, EscalationRequest
from backend.schemas.timeline import TimelineEventType
from backend.security.auth import CurrentUser, can_manage_case
from backend.services.database import Database, DatabaseError
from backend.services.notifications import create_notification, notify_case_managers
from backend.services.timeline import create_timeline_event

DEFAULT_SETTINGS = {"allow_public_escalation": False, "allow_public_sightings": True, "allow_location_sharing": False, "allow_photo_reports": False, "auto_expire_publication": True, "retention_days": 30}


def _db_error(error: DatabaseError) -> HTTPException:
    return HTTPException(status_code=503, detail="Database operation failed.")


def _case(database: Database, case_id: UUID) -> dict:
    row = database.case_by_id(str(case_id))
    if not row:
        raise HTTPException(status_code=404, detail="Case not found.")
    return row


def _settings(database: Database, case_id: UUID) -> dict:
    row = database.case_settings_by_case_id(str(case_id))
    if row:
        return row
    return database.create_case_settings({"case_id": str(case_id), **DEFAULT_SETTINGS})


def _manager(current_user: CurrentUser, case: dict) -> None:
    if not can_manage_case(current_user, case):
        raise HTTPException(status_code=403, detail="Only an authorized case manager can perform this action.")


def _active_member(database: Database, current_user: CurrentUser, case_id: UUID) -> bool:
    return any(str(row.get("case_id")) == str(case_id) and str(row.get("user_id")) == str(current_user.profile_id) and row.get("status") == "ACTIVE" and row.get("left_at") is None for row in database.list_case_memberships_for_user(str(current_user.profile_id)))


def get_settings(database: Database, current_user: CurrentUser, case_id: UUID) -> dict:
    try:
        case = _case(database, case_id)
        if current_user.role != UserRole.SUPER_ADMIN and not can_manage_case(current_user, case) and not _active_member(database, current_user, case_id):
            raise HTTPException(status_code=404, detail="Case not found.")
        return _settings(database, case_id)
    except DatabaseError as error:
        raise _db_error(error) from error


def update_settings(database: Database, current_user: CurrentUser, case_id: UUID, payload: CaseSettingsUpdate) -> dict:
    try:
        case = _case(database, case_id)
        _manager(current_user, case)
        _settings(database, case_id)
        values = payload.model_dump(exclude_none=True)
        return database.update_case_settings(str(case_id), values) if values else database.case_settings_by_case_id(str(case_id))
    except DatabaseError as error:
        raise _db_error(error) from error


def request_escalation(database: Database, current_user: CurrentUser, case_id: UUID, payload: EscalationRequest) -> dict:
    try:
        case = _case(database, case_id)
        _manager(current_user, case)
        settings = _settings(database, case_id)
        if not settings.get("allow_public_escalation"):
            raise HTTPException(status_code=409, detail="Public escalation is disabled for this case.")
        if case.get("status") not in {CaseStatus.LOCAL_SEARCH.value, CaseStatus.LOCAL_SEARCH_COMPLETED.value}:
            raise HTTPException(status_code=409, detail="Case is not eligible for public escalation.")
        pending = database.list_case_publications(str(case_id), "PUBLIC", "PENDING")
        if pending:
            raise HTTPException(status_code=409, detail="A public escalation request is already pending.")
        publication = database.create_case_publication({"case_id": str(case_id), "published_by": str(current_user.profile_id), "scope": "PUBLIC", "reason": payload.reason, "status": "PENDING"})
        database.update_case(str(case_id), {"status": CaseStatus.PUBLIC_ESCALATION_PENDING.value})
        create_timeline_event(database, case_id, TimelineEventType.CASE_ESCALATED, current_user.profile_id, "Public escalation requested.", {"publication_id": str(publication["id"])})
        notify_case_managers(database, case, case_id, NotificationType.SEARCH_EXPANSION, "Public Escalation Requested", "A public escalation request requires review.", {"publication_id": str(publication["id"])})
        return publication
    except DatabaseError as error:
        raise _db_error(error) from error


def _pending(database: Database, case_id: UUID) -> dict:
    rows = database.list_case_publications(str(case_id), "PUBLIC", "PENDING")
    if not rows:
        raise HTTPException(status_code=409, detail="No pending public escalation exists.")
    return rows[0]


def approve_escalation(database: Database, current_user: CurrentUser, case_id: UUID) -> dict:
    try:
        case = _case(database, case_id)
        _manager(current_user, case)
        settings = _settings(database, case_id)
        if case.get("status") != CaseStatus.PUBLIC_ESCALATION_PENDING.value or not settings.get("allow_public_escalation"):
            raise HTTPException(status_code=409, detail="Case is not eligible for public approval.")
        publication = _pending(database, case_id)
        now = datetime.now(timezone.utc)
        expires = now + timedelta(days=int(settings["retention_days"])) if settings.get("auto_expire_publication") else None
        active = database.update_case_publication(str(publication["id"]), {"status": "ACTIVE", "scope": "PUBLIC", "approved_at": now.isoformat(), "expires_at": expires.isoformat() if expires else None})
        database.update_case(str(case_id), {"is_public": True, "public_at": now.isoformat(), "status": CaseStatus.PUBLIC_SEARCH.value})
        create_timeline_event(database, case_id, TimelineEventType.PUBLIC_SEARCH_STARTED, current_user.profile_id, "Public search started.", {"publication_id": str(publication["id"])})
        for profile in database.list_active_profiles(UserRole.VOLUNTEER.value):
            create_notification(database, UUID(str(profile["id"])), case_id, NotificationType.CASE_PUBLIC, "Public Search Case", f"{case.get('title', 'A case')} is open for public search. Open the case and search assigned areas.", {"case_id": str(case_id)})
        return active
    except DatabaseError as error:
        raise _db_error(error) from error


def reject_escalation(database: Database, current_user: CurrentUser, case_id: UUID) -> dict:
    try:
        case = _case(database, case_id)
        _manager(current_user, case)
        publication = _pending(database, case_id)
        closed = database.update_case_publication(str(publication["id"]), {"status": "CLOSED"})
        database.update_case(str(case_id), {"status": CaseStatus.LOCAL_SEARCH_COMPLETED.value})
        create_timeline_event(database, case_id, TimelineEventType.CASE_ESCALATED, current_user.profile_id, "Public escalation request rejected.")
        return closed
    except DatabaseError as error:
        raise _db_error(error) from error


def expire_if_needed(database: Database, case_id: UUID) -> None:
    now = datetime.now(timezone.utc)
    for publication in database.list_case_publications(str(case_id), "PUBLIC", "ACTIVE"):
        expires_at = publication.get("expires_at")
        if expires_at and datetime.fromisoformat(str(expires_at).replace("Z", "+00:00")) <= now:
            database.update_case_publication(str(publication["id"]), {"status": "EXPIRED"})
            case = database.case_by_id(str(case_id))
            if case and case.get("status") == CaseStatus.PUBLIC_SEARCH.value:
                database.update_case(str(case_id), {"is_public": False, "status": CaseStatus.LOCAL_SEARCH_COMPLETED.value})
                create_timeline_event(database, case_id, TimelineEventType.CASE_ESCALATED, None, "Public search publication expired.")


def _public_case(database: Database, case_id: UUID) -> tuple[dict, dict, dict]:
    expire_if_needed(database, case_id)
    case = _case(database, case_id)
    settings = _settings(database, case_id)
    rows = database.list_case_publications(str(case_id), "PUBLIC", "ACTIVE")
    now = datetime.now(timezone.utc)
    publication = next((row for row in rows if not row.get("expires_at") or datetime.fromisoformat(str(row["expires_at"]).replace("Z", "+00:00")) > now), None)
    if not case.get("is_public") or case.get("status") != CaseStatus.PUBLIC_SEARCH.value or not publication:
        raise HTTPException(status_code=404, detail="Public case not found.")
    return case, settings, publication


def public_case(database: Database, case_id: UUID) -> dict:
    case, settings, publication = _public_case(database, case_id)
    return {"id": case["id"], "case_number": case["case_number"], "title": case["title"], "description": case.get("description"), "event_name": case.get("event_name"), "venue_name": case.get("venue_name"), "last_seen_at": case.get("last_seen_at"), "last_seen_location": case.get("last_seen_location") if settings.get("allow_location_sharing") else None, "priority": case.get("priority"), "public_at": case.get("public_at"), "allow_public_sightings": settings.get("allow_public_sightings", False), "allow_photo_reports": settings.get("allow_photo_reports", False), "expires_at": publication.get("expires_at")}


def list_public_cases(database: Database) -> list[dict]:
    rows = database.list_cases()
    result = []
    for case in rows:
        if case.get("is_public") and case.get("status") == CaseStatus.PUBLIC_SEARCH.value:
            try:
                result.append(public_case(database, UUID(str(case["id"]))))
            except HTTPException:
                continue
    return result


def public_status(database: Database, current_user: CurrentUser, case_id: UUID) -> dict:
    case = _case(database, case_id)
    if current_user.role != UserRole.SUPER_ADMIN and not can_manage_case(current_user, case) and not _active_member(database, current_user, case_id):
        raise HTTPException(status_code=404, detail="Case not found.")
    expire_if_needed(database, case_id)
    rows = database.list_case_publications(str(case_id), "PUBLIC")
    publication = rows[0] if rows else None
    return {"is_public": bool(case.get("is_public")), "publication_status": publication.get("status") if publication else None, "scope": publication.get("scope") if publication else None, "public_at": case.get("public_at"), "expires_at": publication.get("expires_at") if publication else None, "status": case.get("status")}