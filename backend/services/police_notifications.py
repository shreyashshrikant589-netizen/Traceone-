import secrets
import string
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status

from backend.schemas.common import CaseStatus, UserRole
from backend.schemas.notifications import NotificationType
from backend.schemas.police_notifications import PoliceNotificationStatus
from backend.schemas.timeline import TimelineEventType
from backend.security.auth import CurrentUser, can_manage_case
from backend.services.database import Database, DatabaseError
from backend.services.notifications import create_notification, notify_case_managers
from backend.services.timeline import create_timeline_event

ACTIVE_STATUSES = {PoliceNotificationStatus.PENDING.value, PoliceNotificationStatus.NOTIFIED.value, PoliceNotificationStatus.ACKNOWLEDGED.value}
REQUESTABLE_CASE_STATUSES = {CaseStatus.PUBLIC_SEARCH.value, CaseStatus.PUBLIC_ESCALATION_PENDING.value, CaseStatus.LOCAL_SEARCH_COMPLETED.value, CaseStatus.LOCAL_SEARCH.value, "ACTIVE", "PAUSED"}


def _db_error(error: DatabaseError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database operation failed.")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _case(database: Database, case_id: UUID) -> dict:
    case = database.case_by_id(str(case_id))
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")
    return case


def _authorize(current_user: CurrentUser, case: dict) -> None:
    if not current_user.profile.get("is_active", False) or not current_user.profile.get("is_verified", False) or not can_manage_case(current_user, case):
        raise HTTPException(status_code=403, detail="Only an authorized case manager can manage police notifications.")


def _reference_id() -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "TRC-POL-" + "".join(secrets.choice(alphabet) for _ in range(8))


def _with_id(row: dict) -> dict:
    result = dict(row)
    result["id"] = str(result["reference_id"])
    return result


def _notification(database: Database, case_id: UUID, notification_id: str) -> dict:
    notification = database.police_notification_by_reference(str(case_id), notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Police notification not found.")
    return notification


def _notify_managers_and_admins(database: Database, case: dict, case_id: UUID, title: str, message: str, data: dict) -> None:
    notify_case_managers(database, case, case_id, NotificationType.POLICE_UPDATE, title, message, data)
    recipients = {str(case.get("created_by")), str(case.get("case_manager_id"))}
    for profile in database.list_active_profiles(UserRole.SUPER_ADMIN.value):
        if str(profile["id"]) not in recipients:
            create_notification(database, UUID(str(profile["id"])), case_id, NotificationType.POLICE_UPDATE, title, message, data)


def request(database: Database, current_user: CurrentUser, case_id: UUID) -> dict:
    try:
        case = _case(database, case_id)
        _authorize(current_user, case)
        if case.get("status") in {CaseStatus.DRAFT.value, CaseStatus.RESOLVED.value, CaseStatus.CLOSED.value}:
            raise HTTPException(status_code=409, detail="Police notification is not available for this case status.")
        if case.get("status") not in REQUESTABLE_CASE_STATUSES:
            raise HTTPException(status_code=409, detail="Case is not in an active search state.")
        if database.list_police_notifications(str(case_id)) and any(row.get("status") in ACTIVE_STATUSES for row in database.list_police_notifications(str(case_id))):
            raise HTTPException(status_code=409, detail="An active police notification already exists.")
        reference_id = _reference_id()
        row = database.create_police_notification({"case_id": str(case_id), "requested_by": str(current_user.profile_id), "status": PoliceNotificationStatus.PENDING.value, "reference_id": reference_id, "notified_at": None, "acknowledged_at": None, "closed_at": None})
        data = {"reference_id": reference_id}
        create_timeline_event(database, case_id, TimelineEventType.POLICE_NOTIFIED, current_user.profile_id, "Police notification requested.", data)
        _notify_managers_and_admins(database, case, case_id, "Police Notification Requested", "TraceOne police notification request is pending.", data)
        return _with_id(row)
    except DatabaseError as error:
        raise _db_error(error) from error


def list_notifications(database: Database, current_user: CurrentUser, case_id: UUID, notification_status: PoliceNotificationStatus | None) -> list[dict]:
    try:
        case = _case(database, case_id)
        _authorize(current_user, case)
        return [_with_id(row) for row in database.list_police_notifications(str(case_id), notification_status.value if notification_status else None)]
    except DatabaseError as error:
        raise _db_error(error) from error


def get(database: Database, current_user: CurrentUser, case_id: UUID, notification_id: str) -> dict:
    try:
        case = _case(database, case_id)
        _authorize(current_user, case)
        return _with_id(_notification(database, case_id, notification_id))
    except DatabaseError as error:
        raise _db_error(error) from error


def _transition(database: Database, current_user: CurrentUser, case_id: UUID, notification_id: str, expected: str, target: str, field: str, title: str, message: str, description: str) -> dict:
    case = _case(database, case_id)
    _authorize(current_user, case)
    notification = _notification(database, case_id, notification_id)
    if notification.get("status") != expected:
        raise HTTPException(status_code=409, detail=f"Cannot change police notification from {notification.get('status')} to {target}.")
    values = {"status": target, field: _now()}
    updated = database.update_police_notification(str(case_id), notification_id, values)
    data = {"reference_id": notification_id, "status": target}
    create_timeline_event(database, case_id, TimelineEventType.POLICE_NOTIFIED, current_user.profile_id, description, data)
    _notify_managers_and_admins(database, case, case_id, title, message, data)
    return _with_id(updated)


def mark_notified(database: Database, current_user: CurrentUser, case_id: UUID, notification_id: str) -> dict:
    try:
        return _transition(database, current_user, case_id, notification_id, PoliceNotificationStatus.PENDING.value, PoliceNotificationStatus.NOTIFIED.value, "notified_at", "Police Notification Updated", "TraceOne police notification was marked as notified.", "Police notification marked as notified.")
    except DatabaseError as error:
        raise _db_error(error) from error


def acknowledge(database: Database, current_user: CurrentUser, case_id: UUID, notification_id: str) -> dict:
    try:
        return _transition(database, current_user, case_id, notification_id, PoliceNotificationStatus.NOTIFIED.value, PoliceNotificationStatus.ACKNOWLEDGED.value, "acknowledged_at", "Police Notification Acknowledged", "TraceOne police notification was acknowledged.", "Police notification acknowledged.")
    except DatabaseError as error:
        raise _db_error(error) from error


def close(database: Database, current_user: CurrentUser, case_id: UUID, notification_id: str) -> dict:
    try:
        case = _case(database, case_id)
        _authorize(current_user, case)
        notification = _notification(database, case_id, notification_id)
        if notification.get("status") not in {PoliceNotificationStatus.NOTIFIED.value, PoliceNotificationStatus.ACKNOWLEDGED.value}:
            raise HTTPException(status_code=409, detail=f"Cannot close police notification from {notification.get('status')}.")
        return _transition(database, current_user, case_id, notification_id, notification["status"], PoliceNotificationStatus.CLOSED.value, "closed_at", "Police Notification Closed", "TraceOne police notification was closed.", "Police notification closed.")
    except DatabaseError as error:
        raise _db_error(error) from error


def cancel(database: Database, current_user: CurrentUser, case_id: UUID, notification_id: str) -> dict:
    try:
        return _transition(database, current_user, case_id, notification_id, PoliceNotificationStatus.PENDING.value, PoliceNotificationStatus.CLOSED.value, "closed_at", "Police Notification Closed", "TraceOne police notification request was cancelled.", "Police notification request cancelled.")
    except DatabaseError as error:
        raise _db_error(error) from error