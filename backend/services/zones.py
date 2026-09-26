from uuid import UUID

from fastapi import HTTPException, status

from backend.schemas.common import UserRole
from backend.schemas.zones import ZoneCreate, ZoneStatus, ZoneStatusUpdate
from backend.security.auth import CurrentUser, can_manage_case
from backend.services.database import Database, DatabaseError
from backend.schemas.timeline import TimelineEventType
from backend.schemas.notifications import NotificationType
from backend.services.timeline import create_timeline_event
from backend.services.notifications import create_notification, notify_active_members


def _db_error(error: DatabaseError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database operation failed.")


def _case(database: Database, case_id: UUID) -> dict:
    case = database.case_by_id(str(case_id))
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found.")
    return case


def _active_member(database: Database, case_id: UUID, profile_id: UUID) -> bool:
    return any(
        str(member.get("case_id")) == str(case_id)
        and str(member.get("user_id")) == str(profile_id)
        and member.get("status") == "ACTIVE"
        and member.get("left_at") is None
        for member in database.list_case_memberships_for_user(str(profile_id))
    )


def _can_view(database: Database, current_user: CurrentUser, case_id: UUID, case: dict) -> bool:
    return current_user.role == UserRole.SUPER_ADMIN or can_manage_case(current_user, case) or _active_member(database, case_id, current_user.profile_id)


def _zone_or_404(database: Database, case_id: UUID, zone_id: UUID) -> dict:
    zone = database.zone_by_id(str(case_id), str(zone_id))
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found.")
    return zone


def create_zone(database: Database, current_user: CurrentUser, case_id: UUID, payload: ZoneCreate) -> dict:
    try:
        case = _case(database, case_id)
        if not can_manage_case(current_user, case):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot create zones for this case.")
        return database.create_zone({
            "case_id": str(case_id),
            "name": payload.name,
            "description": payload.description,
            "geometry": payload.geometry.as_multipolygon(),
            "status": ZoneStatus.UNSEARCHED.value,
            "priority_score": None,
            "priority_rank": None,
            "assigned_volunteer_id": None,
        })
    except DatabaseError as error:
        raise _db_error(error) from error


def list_zones(database: Database, current_user: CurrentUser, case_id: UUID) -> list[dict]:
    try:
        case = _case(database, case_id)
        if not _can_view(database, current_user, case_id, case):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to view these zones.")
        return database.list_zones(str(case_id))
    except DatabaseError as error:
        raise _db_error(error) from error


def get_zone(database: Database, current_user: CurrentUser, case_id: UUID, zone_id: UUID) -> dict:
    try:
        case = _case(database, case_id)
        if not _can_view(database, current_user, case_id, case):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to view this zone.")
        return _zone_or_404(database, case_id, zone_id)
    except DatabaseError as error:
        raise _db_error(error) from error


def assign_zone(database: Database, current_user: CurrentUser, case_id: UUID, zone_id: UUID, volunteer_id: UUID) -> dict:
    try:
        case = _case(database, case_id)
        if not can_manage_case(current_user, case):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot assign this zone.")
        zone = _zone_or_404(database, case_id, zone_id)
        volunteer = database.profile_by_id(str(volunteer_id))
        if not volunteer or volunteer.get("role") != UserRole.VOLUNTEER.value or not volunteer.get("is_active") or not volunteer.get("is_verified"):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Volunteer is not eligible for assignment.")
        if not _active_member(database, case_id, volunteer_id):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Volunteer is not an active case member.")
        if zone.get("assigned_volunteer_id") and str(zone["assigned_volunteer_id"]) != str(volunteer_id):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Zone is already assigned.")
        updated = database.update_zone(str(case_id), str(zone_id), {"assigned_volunteer_id": str(volunteer_id), "status": ZoneStatus.ASSIGNED.value})
        create_timeline_event(database, case_id, TimelineEventType.ZONE_ASSIGNED, current_user.profile_id, "Zone assigned.", {"zone_id": str(zone_id), "volunteer_id": str(volunteer_id)})
        create_notification(database, volunteer_id, case_id, NotificationType.ZONE_ASSIGNED, "New Search Zone Assigned", f"Zone {updated.get('name', '')} has been assigned to you.", {"zone_id": str(zone_id)})
        return updated
    except DatabaseError as error:
        raise _db_error(error) from error


def unassign_zone(database: Database, current_user: CurrentUser, case_id: UUID, zone_id: UUID) -> dict:
    try:
        case = _case(database, case_id)
        if not can_manage_case(current_user, case):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot unassign this zone.")
        zone = _zone_or_404(database, case_id, zone_id)
        values = {"assigned_volunteer_id": None}
        if zone.get("status") == ZoneStatus.ASSIGNED.value:
            values["status"] = ZoneStatus.UNSEARCHED.value
        return database.update_zone(str(case_id), str(zone_id), values)
    except DatabaseError as error:
        raise _db_error(error) from error


def update_status(database: Database, current_user: CurrentUser, case_id: UUID, zone_id: UUID, payload: ZoneStatusUpdate) -> dict:
    try:
        case = _case(database, case_id)
        zone = _zone_or_404(database, case_id, zone_id)
        manages = can_manage_case(current_user, case)
        owns_assignment = str(zone.get("assigned_volunteer_id")) == str(current_user.profile_id)
        if not manages and not owns_assignment:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot update this zone.")
        if payload.status in {ZoneStatus.ASSIGNED, ZoneStatus.IN_PROGRESS} and not zone.get("assigned_volunteer_id"):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This status requires an assigned volunteer.")
        if payload.status == ZoneStatus.UNSEARCHED and zone.get("assigned_volunteer_id"):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Unassign the volunteer before resetting this zone.")
        return database.update_zone(str(case_id), str(zone_id), {"status": payload.status.value})
    except DatabaseError as error:
        raise _db_error(error) from error


def my_assignments(database: Database, current_user: CurrentUser, case_id: UUID) -> list[dict]:
    try:
        case = _case(database, case_id)
        if not _active_member(database, case_id, current_user.profile_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not an active case member.")
        return [zone for zone in database.list_zones(str(case_id)) if str(zone.get("assigned_volunteer_id")) == str(current_user.profile_id)]
    except DatabaseError as error:
        raise _db_error(error) from error
