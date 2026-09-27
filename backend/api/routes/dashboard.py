from uuid import UUID

from fastapi import APIRouter, Depends, Query

from backend.dependencies import get_database
from backend.schemas.dashboard import DashboardResponse, DashboardStats
from backend.security.auth import CurrentUser, require_verified_user
from backend.services import dashboard
from backend.services.database import Database

router = APIRouter(prefix="/cases/{case_id}/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard(case_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> DashboardResponse:
    return DashboardResponse.model_validate(dashboard.overview(database, current_user, case_id))


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(case_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> DashboardStats:
    return DashboardStats.model_validate(dashboard.stats(database, current_user, case_id))


@router.get("/live-search")
def get_live_search(case_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> dict:
    return dashboard.live_search(database, current_user, case_id)


@router.get("/intelligence")
def get_intelligence(case_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> dict:
    return dashboard.intelligence(database, current_user, case_id)


@router.get("/activity")
def get_activity(case_id: UUID, limit: int = Query(20, ge=1, le=100), current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> list[dict]:
    return dashboard.activity(database, current_user, case_id, limit)


@router.get("/volunteers")
def get_volunteers(case_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> list[dict]:
    return dashboard.volunteers(database, current_user, case_id)


@router.get("/control")
def get_control(case_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> dict:
    return dashboard.control(database, current_user, case_id)