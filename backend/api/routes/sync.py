from uuid import UUID

from fastapi import APIRouter, Depends, Header, Query

from backend.dependencies import get_database
from backend.schemas.sync import SyncProcessResponse, SyncQueueCreate, SyncQueueResponse, SyncStatus, SyncStatusResponse
from backend.security.auth import CurrentUser, require_verified_user
from backend.services import sync
from backend.services.database import Database

router = APIRouter(prefix="/sync", tags=["offline-sync"])


def device_header(device_session_id: UUID = Header(alias="X-Device-Session-ID")) -> UUID:
    return device_session_id


@router.post("/queue", response_model=SyncQueueResponse, status_code=201)
def queue_operation(payload: SyncQueueCreate, current_user: CurrentUser = Depends(require_verified_user), device_session_id: UUID = Depends(device_header), database: Database = Depends(get_database)) -> SyncQueueResponse:
    return SyncQueueResponse.model_validate(sync.queue(database, current_user, device_session_id, payload))


@router.post("/process", response_model=SyncProcessResponse)
def process_operations(limit: int = Query(50, ge=1, le=50), current_user: CurrentUser = Depends(require_verified_user), device_session_id: UUID = Depends(device_header), database: Database = Depends(get_database)) -> SyncProcessResponse:
    return SyncProcessResponse(processed=[SyncQueueResponse.model_validate(row) for row in sync.process(database, current_user, device_session_id, limit)])


@router.get("/status", response_model=SyncStatusResponse)
def sync_status(current_user: CurrentUser = Depends(require_verified_user), device_session_id: UUID = Depends(device_header), database: Database = Depends(get_database)) -> SyncStatusResponse:
    return SyncStatusResponse.model_validate(sync.status_summary(database, current_user, device_session_id))


@router.get("/history", response_model=list[SyncQueueResponse])
def sync_history(limit: int = Query(100, ge=1, le=200), queue_status: SyncStatus | None = None, current_user: CurrentUser = Depends(require_verified_user), device_session_id: UUID = Depends(device_header), database: Database = Depends(get_database)) -> list[SyncQueueResponse]:
    return [SyncQueueResponse.model_validate(row) for row in sync.history(database, current_user, device_session_id, limit, queue_status)]


@router.post("/{queue_id}/retry", response_model=SyncQueueResponse)
def retry_operation(queue_id: UUID, current_user: CurrentUser = Depends(require_verified_user), device_session_id: UUID = Depends(device_header), database: Database = Depends(get_database)) -> SyncQueueResponse:
    return SyncQueueResponse.model_validate(sync.retry(database, current_user, device_session_id, queue_id))