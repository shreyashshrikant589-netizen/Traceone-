from uuid import UUID

from fastapi import APIRouter, Depends

from backend.dependencies import get_database
from backend.schemas.sessions import SessionComplete, SessionCreate, SessionResponse, SessionStatus
from backend.security.auth import CurrentUser, require_verified_user
from backend.services import sessions as session_service
from backend.services.database import Database

router = APIRouter(prefix="/cases/{case_id}", tags=["search-sessions"])


@router.post("/zones/{zone_id}/search-sessions", response_model=SessionResponse, status_code=201)
def start_session(case_id: UUID, zone_id: UUID, payload: SessionCreate, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> SessionResponse:
    return SessionResponse.model_validate(session_service.start_session(database, current_user, case_id, zone_id, payload))


@router.get("/search-sessions/my-active", response_model=list[SessionResponse])
def my_active(case_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> list[SessionResponse]:
    return [SessionResponse.model_validate(row) for row in session_service.list_my_active(database, current_user, case_id)]


@router.get("/search-sessions", response_model=list[SessionResponse])
def list_sessions(case_id: UUID, zone_id: UUID | None = None, volunteer_id: UUID | None = None, session_status: SessionStatus | None = None, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> list[SessionResponse]:
    return [SessionResponse.model_validate(row) for row in session_service.list_case_sessions(database, current_user, case_id, zone_id, volunteer_id, session_status)]


@router.get("/search-sessions/{session_id}", response_model=SessionResponse)
def get_session(case_id: UUID, session_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> SessionResponse:
    return SessionResponse.model_validate(session_service.get_session(database, current_user, case_id, session_id))


@router.post("/search-sessions/{session_id}/pause", response_model=SessionResponse)
def pause_session(case_id: UUID, session_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> SessionResponse:
    return SessionResponse.model_validate(session_service.transition(database, current_user, case_id, session_id, SessionStatus.PAUSED))


@router.post("/search-sessions/{session_id}/resume", response_model=SessionResponse)
def resume_session(case_id: UUID, session_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> SessionResponse:
    return SessionResponse.model_validate(session_service.transition(database, current_user, case_id, session_id, SessionStatus.ACTIVE))


@router.post("/search-sessions/{session_id}/complete", response_model=SessionResponse)
def complete_session(case_id: UUID, session_id: UUID, payload: SessionComplete, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> SessionResponse:
    return SessionResponse.model_validate(session_service.transition(database, current_user, case_id, session_id, SessionStatus.COMPLETED, payload))


@router.post("/search-sessions/{session_id}/cancel", response_model=SessionResponse)
def cancel_session(case_id: UUID, session_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> SessionResponse:
    return SessionResponse.model_validate(session_service.transition(database, current_user, case_id, session_id, SessionStatus.CANCELLED))
