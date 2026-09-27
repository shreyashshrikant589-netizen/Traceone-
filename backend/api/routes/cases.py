from uuid import UUID

from fastapi import APIRouter, Depends

from backend.dependencies import get_database
from backend.schemas.cases import CaseCreate, CaseResponse, CaseUpdate
from backend.schemas.public_cases import CaseSettingsResponse, CaseSettingsUpdate, EscalationRequest, PublicStatusResponse
from backend.security.auth import CurrentUser, require_active_user, require_verified_user
from backend.services import cases as case_service
from backend.services.database import Database

router = APIRouter(prefix="/cases", tags=["cases"])


@router.get("/{case_id}/settings", response_model=CaseSettingsResponse)
def get_case_settings(case_id: UUID, current_user: CurrentUser = Depends(require_active_user), database: Database = Depends(get_database)) -> CaseSettingsResponse:
    return CaseSettingsResponse.model_validate(case_service.get_settings(database, current_user, case_id))


@router.patch("/{case_id}/settings", response_model=CaseSettingsResponse)
def update_case_settings(case_id: UUID, payload: CaseSettingsUpdate, current_user: CurrentUser = Depends(require_active_user), database: Database = Depends(get_database)) -> CaseSettingsResponse:
    return CaseSettingsResponse.model_validate(case_service.update_settings(database, current_user, case_id, payload))


@router.post("/{case_id}/public-escalation/request", status_code=201)
def request_public_escalation(case_id: UUID, payload: EscalationRequest, current_user: CurrentUser = Depends(require_active_user), database: Database = Depends(get_database)) -> dict:
    return case_service.request_escalation(database, current_user, case_id, payload)


@router.post("/{case_id}/public-escalation/approve")
def approve_public_escalation(case_id: UUID, current_user: CurrentUser = Depends(require_active_user), database: Database = Depends(get_database)) -> dict:
    return case_service.approve_escalation(database, current_user, case_id)


@router.post("/{case_id}/public-escalation/reject")
def reject_public_escalation(case_id: UUID, current_user: CurrentUser = Depends(require_active_user), database: Database = Depends(get_database)) -> dict:
    return case_service.reject_escalation(database, current_user, case_id)


@router.get("/{case_id}/public-status", response_model=PublicStatusResponse)
def get_public_status(case_id: UUID, current_user: CurrentUser = Depends(require_active_user), database: Database = Depends(get_database)) -> PublicStatusResponse:
    return PublicStatusResponse.model_validate(case_service.public_status(database, current_user, case_id))


@router.post("/{case_id}/resolve", response_model=CaseResponse)
def resolve_case(case_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> CaseResponse:
    return CaseResponse.model_validate(case_service.resolve_case(database, current_user, case_id))


@router.post("/{case_id}/close", response_model=CaseResponse)
def close_case(case_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> CaseResponse:
    return CaseResponse.model_validate(case_service.close_case(database, current_user, case_id))


@router.post("", response_model=CaseResponse, status_code=201)
def create_case(
    payload: CaseCreate,
    current_user: CurrentUser = Depends(require_active_user),
    database: Database = Depends(get_database),
) -> CaseResponse:
    return CaseResponse.model_validate(case_service.create_case(database, current_user, payload))


@router.get("", response_model=list[CaseResponse])
def list_cases(
    current_user: CurrentUser = Depends(require_active_user),
    database: Database = Depends(get_database),
) -> list[CaseResponse]:
    return [CaseResponse.model_validate(case) for case in case_service.list_cases(database, current_user)]


@router.get("/{case_id}", response_model=CaseResponse)
def get_case(
    case_id: UUID,
    current_user: CurrentUser = Depends(require_active_user),
    database: Database = Depends(get_database),
) -> CaseResponse:
    return CaseResponse.model_validate(case_service.get_case(database, current_user, case_id))


@router.patch("/{case_id}", response_model=CaseResponse)
def update_case(
    case_id: UUID,
    payload: CaseUpdate,
    current_user: CurrentUser = Depends(require_active_user),
    database: Database = Depends(get_database),
) -> CaseResponse:
    return CaseResponse.model_validate(case_service.update_case(database, current_user, case_id, payload))
