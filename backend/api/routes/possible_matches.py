from uuid import UUID

from fastapi import APIRouter, Depends

from backend.dependencies import get_database
from backend.schemas.possible_matches import PossibleMatchCreate, PossibleMatchResponse, PossibleMatchReview
from backend.security.auth import CurrentUser, require_verified_user
from backend.services import possible_matches
from backend.services.database import Database

router = APIRouter(prefix="/cases/{case_id}/possible-matches", tags=["possible-matches"])


@router.post("", response_model=PossibleMatchResponse, status_code=201)
def submit_possible_match(case_id: UUID, payload: PossibleMatchCreate, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> PossibleMatchResponse:
    return PossibleMatchResponse.model_validate(possible_matches.submit(database, current_user, case_id, payload))


@router.get("", response_model=list[PossibleMatchResponse])
def list_possible_matches(case_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> list[PossibleMatchResponse]:
    return [PossibleMatchResponse.model_validate(row) for row in possible_matches.list_matches(database, current_user, case_id)]


@router.get("/{match_id}", response_model=PossibleMatchResponse)
def get_possible_match(case_id: UUID, match_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> PossibleMatchResponse:
    return PossibleMatchResponse.model_validate(possible_matches.get_match(database, current_user, case_id, match_id))


@router.post("/{match_id}/review", response_model=PossibleMatchResponse)
def review_possible_match(case_id: UUID, match_id: UUID, payload: PossibleMatchReview, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> PossibleMatchResponse:
    return PossibleMatchResponse.model_validate(possible_matches.review(database, current_user, case_id, match_id, payload))