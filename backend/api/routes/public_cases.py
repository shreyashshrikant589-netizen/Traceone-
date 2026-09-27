from uuid import UUID

from fastapi import APIRouter, Depends

from backend.dependencies import get_database
from backend.schemas.public_cases import PublicCaseResponse
from backend.security.auth import CurrentUser, require_verified_user
from backend.services import public_cases as public_case_service
from backend.services.database import Database

router = APIRouter(prefix="/public/cases", tags=["public-cases"])


@router.get("", response_model=list[PublicCaseResponse])
def list_public_cases(current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> list[PublicCaseResponse]:
    return [PublicCaseResponse.model_validate(row) for row in public_case_service.list_public_cases(database)]


@router.get("/{case_id}", response_model=PublicCaseResponse)
def get_public_case(case_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> PublicCaseResponse:
    return PublicCaseResponse.model_validate(public_case_service.public_case(database, case_id))