from uuid import UUID

from fastapi import APIRouter, Depends, Query

from backend.dependencies import get_database
from backend.schemas.volunteer_locations import VolunteerLocationCreate, VolunteerLocationResponse
from backend.security.auth import CurrentUser, require_verified_user
from backend.services import volunteer_locations
from backend.services.database import Database

router = APIRouter(prefix="/cases/{case_id}", tags=["volunteer-locations"])


@router.post("/search-sessions/{session_id}/location", response_model=VolunteerLocationResponse, status_code=201)
def submit_location(case_id: UUID, session_id: UUID, payload: VolunteerLocationCreate, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> VolunteerLocationResponse:
    return VolunteerLocationResponse.model_validate(volunteer_locations.submit(database, current_user, case_id, session_id, payload))


@router.get("/search-sessions/{session_id}/location/latest", response_model=VolunteerLocationResponse)
def latest_location(case_id: UUID, session_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> VolunteerLocationResponse:
    return VolunteerLocationResponse.model_validate(volunteer_locations.latest(database, current_user, case_id, session_id))


@router.get("/search-sessions/{session_id}/location/history", response_model=list[VolunteerLocationResponse])
def location_history(case_id: UUID, session_id: UUID, limit: int = Query(100, ge=1, le=200), current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> list[VolunteerLocationResponse]:
    return [VolunteerLocationResponse.model_validate(row) for row in volunteer_locations.history(database, current_user, case_id, session_id, limit)]


@router.get("/volunteer-locations/active", response_model=list[VolunteerLocationResponse])
def active_locations(case_id: UUID, minutes: int = Query(15, ge=1, le=60), current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> list[VolunteerLocationResponse]:
    return [VolunteerLocationResponse.model_validate(row) for row in volunteer_locations.active_locations(database, current_user, case_id, minutes)]