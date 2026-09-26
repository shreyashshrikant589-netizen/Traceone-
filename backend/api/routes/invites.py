from uuid import UUID

from fastapi import APIRouter, Depends, status

from backend.dependencies import get_database
from backend.schemas.invites import InviteCreate, InvitePreviewResponse, InviteResponse, JoinCredential, JoinResponse
from backend.security.auth import CurrentUser, require_active_user, require_verified_user
from backend.services import invites as invite_service
from backend.services.database import Database

router = APIRouter(prefix="/cases", tags=["case-invites"])


@router.post("/invites/resolve", response_model=InvitePreviewResponse)
def resolve_case_invite(
    payload: JoinCredential,
    current_user: CurrentUser = Depends(require_verified_user),
    database: Database = Depends(get_database),
) -> InvitePreviewResponse:
    result = invite_service.resolve_invite(database, current_user, payload)
    case = result["case"]
    invite = result["invite"]
    return InvitePreviewResponse(
        case_id=case["id"],
        case_number=case["case_number"],
        title=case["title"],
        event_name=case.get("event_name"),
        venue_name=case.get("venue_name"),
        status=case["status"],
        invite_valid=True,
        expires_at=invite["expires_at"],
    )



@router.post("/{case_id}/invites", response_model=InviteResponse, status_code=status.HTTP_201_CREATED)
def create_case_invite(
    case_id: UUID,
    payload: InviteCreate,
    current_user: CurrentUser = Depends(require_active_user),
    database: Database = Depends(get_database),
) -> InviteResponse:
    result = invite_service.create_invite(database, current_user, case_id, payload)
    saved = result["saved"]
    return InviteResponse(
        invite_id=saved["id"],
        case_id=saved["case_id"],
        join_code=result["join_code"],
        invite_token=result["invite_token"],
        expires_at=saved["expires_at"],
        max_uses=saved.get("max_uses"),
    )


@router.post("/{case_id}/invites/preview", response_model=InvitePreviewResponse)
def preview_case_invite(
    case_id: UUID,
    payload: JoinCredential,
    current_user: CurrentUser = Depends(require_verified_user),
    database: Database = Depends(get_database),
) -> InvitePreviewResponse:
    result = invite_service.preview_invite(database, current_user, case_id, payload)
    case = result["case"]
    invite = result["invite"]
    return InvitePreviewResponse(
        case_id=case["id"],
        case_number=case["case_number"],
        title=case["title"],
        event_name=case.get("event_name"),
        venue_name=case.get("venue_name"),
        status=case["status"],
        invite_valid=True,
        expires_at=invite["expires_at"],
    )


@router.post("/{case_id}/join", response_model=JoinResponse)
def join_case(
    case_id: UUID,
    payload: JoinCredential,
    current_user: CurrentUser = Depends(require_verified_user),
    database: Database = Depends(get_database),
) -> JoinResponse:
    membership = invite_service.join_case(database, current_user, case_id, payload)
    return JoinResponse(
        case_id=membership["case_id"],
        membership_id=membership["id"],
        role=membership["role"],
        status=membership["status"],
        joined_at=membership["joined_at"],
    )


@router.post("/{case_id}/leave", response_model=JoinResponse)
def leave_case(
    case_id: UUID,
    current_user: CurrentUser = Depends(require_active_user),
    database: Database = Depends(get_database),
) -> JoinResponse:
    membership = invite_service.leave_case(database, current_user, case_id)
    return JoinResponse(
        case_id=membership["case_id"],
        membership_id=membership["id"],
        role=membership["role"],
        status=membership["status"],
        joined_at=membership["joined_at"],
    )
