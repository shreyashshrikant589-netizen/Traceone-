from datetime import datetime
from enum import StrEnum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class SyncOperationType(StrEnum):
    CREATE_REPORT = "CREATE_REPORT"
    CREATE_WITNESS_REPORT = "CREATE_WITNESS_REPORT"
    CREATE_EVIDENCE = "CREATE_EVIDENCE"
    SUBMIT_LOCATION = "SUBMIT_LOCATION"


class SyncEntityType(StrEnum):
    REPORTS = "reports"
    WITNESS_REPORTS = "witness_reports"
    EVIDENCE = "evidence"
    VOLUNTEER_LOCATIONS = "volunteer_locations"


class SyncStatus(StrEnum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    SYNCED = "SYNCED"
    FAILED = "FAILED"
    CONFLICT = "CONFLICT"


class SyncQueueCreate(BaseModel):
    client_operation_id: UUID
    operation_type: SyncOperationType
    entity_type: SyncEntityType
    entity_id: UUID | None = None
    payload: dict[str, Any] = Field(default_factory=dict)


class SyncQueueResponse(BaseModel):
    id: UUID
    user_id: UUID
    device_session_id: UUID
    client_operation_id: UUID
    operation_type: SyncOperationType
    entity_type: SyncEntityType
    entity_id: UUID | None = None
    payload: dict[str, Any]
    status: SyncStatus
    attempt_count: int
    last_attempt_at: datetime | None = None
    synced_at: datetime | None = None
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime


class SyncStatusResponse(BaseModel):
    pending_count: int
    processing_count: int
    synced_count: int
    failed_count: int
    conflict_count: int


class SyncProcessResponse(BaseModel):
    processed: list[SyncQueueResponse]
