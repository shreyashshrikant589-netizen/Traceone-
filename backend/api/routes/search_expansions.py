from uuid import UUID

from fastapi import APIRouter, Depends

from backend.dependencies import get_database
from backend.schemas.search_expansions import SearchExpansionResponse
from backend.security.auth import CurrentUser, require_verified_user
from backend.services import search_expansions
from backend.services.database import Database

router = APIRouter(prefix="/cases/{case_id}", tags=["search-expansions"])


@router.post("/ai/search-expansion/recommend", response_model=SearchExpansionResponse, status_code=201)
def recommend_search_expansion(case_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> SearchExpansionResponse:
    return SearchExpansionResponse.model_validate(search_expansions.recommend(database, current_user, case_id))


@router.get("/ai/search-expansion", response_model=SearchExpansionResponse)
def get_latest_search_expansion(case_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> SearchExpansionResponse:
    return SearchExpansionResponse.model_validate(search_expansions.latest(database, current_user, case_id))


@router.get("/search-expansions", response_model=list[SearchExpansionResponse])
def list_search_expansions(case_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> list[SearchExpansionResponse]:
    return [SearchExpansionResponse.model_validate(row) for row in search_expansions.list_expansions(database, current_user, case_id)]


@router.post("/search-expansions/{expansion_id}/approve", response_model=SearchExpansionResponse)
def approve_search_expansion(case_id: UUID, expansion_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> SearchExpansionResponse:
    return SearchExpansionResponse.model_validate(search_expansions.approve(database, current_user, case_id, expansion_id))


@router.post("/search-expansions/{expansion_id}/reject", response_model=SearchExpansionResponse)
def reject_search_expansion(case_id: UUID, expansion_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> SearchExpansionResponse:
    return SearchExpansionResponse.model_validate(search_expansions.reject(database, current_user, case_id, expansion_id))


@router.post("/search-expansions/{expansion_id}/activate", response_model=SearchExpansionResponse)
def activate_search_expansion(case_id: UUID, expansion_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> SearchExpansionResponse:
    return SearchExpansionResponse.model_validate(search_expansions.activate(database, current_user, case_id, expansion_id))


@router.post("/search-expansions/{expansion_id}/complete", response_model=SearchExpansionResponse)
def complete_search_expansion(case_id: UUID, expansion_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> SearchExpansionResponse:
    return SearchExpansionResponse.model_validate(search_expansions.complete(database, current_user, case_id, expansion_id))