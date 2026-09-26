from datetime import datetime, timezone
import hashlib
import secrets
from uuid import UUID

from fastapi import HTTPException, status

from backend.schemas.invites import InviteCreate, JoinCredential
from backend.schemas.common import UserRole
from backend.security.auth import CurrentUser, can_manage_case
from backend.services.database import Database, DatabaseError
from backend.schemas.timeline import TimelineEventType
from backend.services.timeline import create_timeline_event


def _database_unavailable(error: DatabaseError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database operation failed.")


def _hash_secret(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _new_join_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _validate_case_manager(database: Database, current_user: CurrentUser, case_id: UUID) -> dict:
    case = database.case_by_id(str(case_id))
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found.")
    if not can_manage_case(current_user, case):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot manage invites for this case.")
    return case


def create_invite(database: Database, current_user: CurrentUser, case_id: UUID, payload: InviteCreate) -> dict:
    try:
        _validate_case_manager(database, current_user, case_id)
        if _parse_datetime(payload.expires_at) <= _now():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invite expiry must be in the future.")

        invite_token = secrets.token_urlsafe(32)
        join_code = _new_join_code()
        values = {
            "case_id": str(case_id),
            "created_by": str(current_user.profile_id),
            "invite_token_hash": _hash_secret(invite_token),
            "join_code_hash": _hash_secret(join_code),
            "expires_at": payload.expires_at.isoformat(),
            "max_uses": payload.max_uses,
            "used_count": 0,
            "is_active": True,
        }
        saved = database.create_case_invite(values)
        return {"saved": saved, "invite_token": invite_token, "join_code": join_code}
    except DatabaseError as error:
        raise _database_unavailable(error) from error


def _find_invite(database: Database, credential: JoinCredential) -> dict:
    try:
        invite = (
            database.invite_by_join_code_hash(_hash_secret(credential.join_code))
            if credential.join_code
            else database.invite_by_token_hash(_hash_secret(credential.invite_token or ""))
        )
    except DatabaseError as error:
        raise _database_unavailable(error) from error

    if not invite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found.")
    if not invite.get("is_active"):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Invite is inactive.")
    expires_at = _parse_datetime(invite["expires_at"])
    if expires_at <= _now():
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Invite has expired.")
    if invite.get("max_uses") is not None and int(invite.get("used_count", 0)) >= int(invite["max_uses"]):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Invite usage limit reached.")
    return invite


def resolve_invite(database: Database, current_user: CurrentUser, credential: JoinCredential) -> dict:
    if current_user.role != UserRole.VOLUNTEER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only volunteers can preview a join invite.")
    invite = _find_invite(database, credential)
    case_id = invite["case_id"]
    try:
        case = database.case_by_id(str(case_id))
    except DatabaseError as error:
        raise _database_unavailable(error) from error
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found.")
    return {"case": case, "invite": invite}


def preview_invite(database: Database, current_user: CurrentUser, case_id: UUID, credential: JoinCredential) -> dict:
    if current_user.role != UserRole.VOLUNTEER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only volunteers can preview a join invite.")
    invite = _find_invite(database, credential)
    if str(invite["case_id"]) != str(case_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found.")
    try:
        case = database.case_by_id(str(case_id))
    except DatabaseError as error:
        raise _database_unavailable(error) from error
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found.")
    return {"case": case, "invite": invite}


def join_case(database: Database, current_user: CurrentUser, case_id: UUID, credential: JoinCredential) -> dict:
    """Consume an invite slot conditionally, then create/reactivate membership.

    The verified schema does not expose a transaction RPC, so the conditional
    used-count update prevents concurrent over-consumption. A future verified
    database function can make reservation and membership insertion atomic.
    """
    if current_user.role != UserRole.VOLUNTEER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only volunteers can join cases.")
    invite = _find_invite(database, credential)
    if str(invite["case_id"]) != str(case_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found.")
    try:
        case = database.case_by_id(str(case_id))
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found.")
        if str(case.get("status", "")).upper() in {"CLOSED", "RESOLVED"}:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This case cannot be joined.")
        existing = database.membership_for_case_user(str(case_id), str(current_user.profile_id))
        if existing and existing.get("status") == "ACTIVE" and existing.get("left_at") is None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You are already an active member of this case.")

        consumed = database.consume_case_invite(invite)
        if not consumed:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Invite usage limit reached.")

        joined_at = _now().isoformat()
        membership = (
            database.reactivate_membership(str(existing["id"]), joined_at)
            if existing and existing.get("status") in {"LEFT", "REMOVED"}
            else database.create_membership({"case_id": str(case_id), "user_id": str(current_user.profile_id), "role": "VOLUNTEER", "status": "ACTIVE", "joined_at": joined_at, "left_at": None})
        )
        create_timeline_event(database, case_id, TimelineEventType.VOLUNTEER_JOINED, current_user.profile_id, "Volunteer joined the case.", {"role": "VOLUNTEER"})
        return membership
    except DatabaseError as error:
        raise _database_unavailable(error) from error


def leave_case(database: Database, current_user: CurrentUser, case_id: UUID) -> dict:
    if current_user.role != UserRole.VOLUNTEER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only volunteers can leave through this endpoint.")
    try:
        membership = database.membership_for_case_user(str(case_id), str(current_user.profile_id))
        if not membership or membership.get("status") != "ACTIVE" or membership.get("left_at") is not None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active membership not found.")
        return database.leave_membership(str(membership["id"]), _now().isoformat())
    except DatabaseError as error:
        raise _database_unavailable(error) from error


def _parse_datetime(value: str | datetime) -> datetime:
    if isinstance(value, datetime):
        parsed = value
    else:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
