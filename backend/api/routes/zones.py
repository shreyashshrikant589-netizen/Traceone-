from uuid import UUID

from fastapi import APIRouter, Depends, status

from backend.dependencies import get_database
from backend.schemas.zones import ZoneAssign, ZoneCreate, ZoneResponse, ZoneStatusUpdate
from backend.security.auth import CurrentUser, require_active_user
from backend.services import zones as zone_service
from backend.services.database import Database

router = APIRouter(prefix="/cases/{case_id}/zones", tags=["zones"])


@router.post("", response_model=ZoneResponse, status_code=status.HTTP_201_CREATED)
def create_zone(case_id: UUID, payload: ZoneCreate, current_user: CurrentUser = Depends(require_active_user), database: Database = Depends(get_database)) -> ZoneResponse:
    return ZoneResponse.model_validate(zone_service.create_zone(database, current_user, case_id, payload))


@router.get("", response_model=list[ZoneResponse])
def list_zones(case_id: UUID, current_user: CurrentUser = Depends(require_active_user), database: Database = Depends(get_database)) -> list[ZoneResponse]:
    return [ZoneResponse.model_validate(zone) for zone in zone_service.list_zones(database, current_user, case_id)]


@router.get("/my", response_model=list[ZoneResponse])
def my_assignments(case_id: UUID, current_user: CurrentUser = Depends(require_active_user), database: Database = Depends(get_database)) -> list[ZoneResponse]:
    return [ZoneResponse.model_validate(zone) for zone in zone_service.my_assignments(database, current_user, case_id)]


@router.get("/{zone_id}", response_model=ZoneResponse)
def get_zone(case_id: UUID, zone_id: UUID, current_user: CurrentUser = Depends(require_active_user), database: Database = Depends(get_database)) -> ZoneResponse:
    return ZoneResponse.model_validate(zone_service.get_zone(database, current_user, case_id, zone_id))


@router.post("/{zone_id}/assign", response_model=ZoneResponse)
def assign_zone(case_id: UUID, zone_id: UUID, payload: ZoneAssign, current_user: CurrentUser = Depends(require_active_user), database: Database = Depends(get_database)) -> ZoneResponse:
    return ZoneResponse.model_validate(zone_service.assign_zone(database, current_user, case_id, zone_id, payload.volunteer_id))


@router.post("/{zone_id}/unassign", response_model=ZoneResponse)
def unassign_zone(case_id: UUID, zone_id: UUID, current_user: CurrentUser = Depends(require_active_user), database: Database = Depends(get_database)) -> ZoneResponse:
    return ZoneResponse.model_validate(zone_service.unassign_zone(database, current_user, case_id, zone_id))


@router.patch("/{zone_id}/status", response_model=ZoneResponse)
def update_zone_status(case_id: UUID, zone_id: UUID, payload: ZoneStatusUpdate, current_user: CurrentUser = Depends(require_active_user), database: Database = Depends(get_database)) -> ZoneResponse:
    return ZoneResponse.model_validate(zone_service.update_status(database, current_user, case_id, zone_id, payload))
