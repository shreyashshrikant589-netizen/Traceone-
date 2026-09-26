from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from pydantic import ValidationError

from backend.schemas.reports import EvidenceCreate, ReportCreate, WitnessCreate
from backend.schemas.sync import SyncEntityType, SyncOperationType, SyncQueueCreate, SyncStatus
from backend.schemas.volunteer_locations import VolunteerLocationCreate
from backend.security.auth import CurrentUser
from backend.services import reports, volunteer_locations
from backend.services.database import Database, DatabaseError

ENTITY_BY_OPERATION = {SyncOperationType.CREATE_REPORT: SyncEntityType.REPORTS, SyncOperationType.CREATE_WITNESS_REPORT: SyncEntityType.WITNESS_REPORTS, SyncOperationType.CREATE_EVIDENCE: SyncEntityType.EVIDENCE, SyncOperationType.SUBMIT_LOCATION: SyncEntityType.VOLUNTEER_LOCATIONS}
MAX_PROCESS_LIMIT = 50
MAX_HISTORY_LIMIT = 200


def _db_error(error: DatabaseError) -> HTTPException:
    return HTTPException(status_code=503, detail="Database operation failed.")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _device(device_session_id: UUID) -> str:
    return str(device_session_id)


def _active_verified(current_user: CurrentUser) -> None:
    if not current_user.profile.get("is_active", False) or not current_user.profile.get("is_verified", False):
        raise HTTPException(status_code=403, detail="Active verified account required.")


def _validate_operation(payload: SyncQueueCreate) -> None:
    if ENTITY_BY_OPERATION[payload.operation_type] != payload.entity_type:
        raise HTTPException(status_code=422, detail="Operation type and entity type do not match.")
    if payload.operation_type == SyncOperationType.SUBMIT_LOCATION and not (payload.entity_id or payload.payload.get("session_id")):
        raise HTTPException(status_code=422, detail="Location sync requires a session_id.")


def _case_id(operation: dict) -> UUID:
    raw = operation.get("payload", {}).get("case_id")
    if not raw:
        raise HTTPException(status_code=422, detail="Synced operation requires a case_id.")
    try:
        return UUID(str(raw))
    except ValueError as error:
        raise HTTPException(status_code=422, detail="Invalid case_id in sync payload.") from error


def queue(database: Database, current_user: CurrentUser, device_session_id: UUID, payload: SyncQueueCreate) -> dict:
    try:
        _active_verified(current_user)
        existing = database.sync_queue_by_operation(str(current_user.profile_id), str(payload.client_operation_id))
        if existing:
            return existing
        _validate_operation(payload)
        values = {"user_id": str(current_user.profile_id), "device_session_id": _device(device_session_id), "client_operation_id": str(payload.client_operation_id), "operation_type": payload.operation_type.value, "entity_type": payload.entity_type.value, "entity_id": str(payload.entity_id) if payload.entity_id else None, "payload": payload.payload, "status": SyncStatus.PENDING.value, "attempt_count": 0, "last_attempt_at": None, "synced_at": None, "error_message": None}
        return database.create_sync_queue(values)
    except DatabaseError as error:
        raise _db_error(error) from error


def _safe_error(error: Exception) -> str:
    if isinstance(error, HTTPException):
        return str(error.detail)
    if isinstance(error, ValidationError):
        return "Invalid operation payload."
    return "Operation could not be applied."


def _execute(database: Database, current_user: CurrentUser, operation: dict) -> dict:
    case_id = _case_id(operation)
    payload = dict(operation.get("payload") or {})
    payload.pop("user_id", None)
    payload.pop("reported_by", None)
    payload.pop("reporter_id", None)
    payload.pop("submitted_by", None)
    payload.pop("status", None)
    payload.pop("created_at", None)
    payload.pop("updated_at", None)
    operation_type = SyncOperationType(operation["operation_type"])
    if operation_type == SyncOperationType.CREATE_REPORT:
        return reports.create_report(database, current_user, case_id, ReportCreate.model_validate(payload))
    if operation_type == SyncOperationType.CREATE_WITNESS_REPORT:
        return reports.create_witness(database, current_user, case_id, WitnessCreate.model_validate(payload))
    if operation_type == SyncOperationType.CREATE_EVIDENCE:
        return reports.create_evidence(database, current_user, case_id, EvidenceCreate.model_validate(payload))
    session_id = operation.get("entity_id") or payload.get("session_id")
    if not session_id:
        raise HTTPException(status_code=422, detail="Location sync requires a session_id.")
    payload.pop("case_id", None)
    payload.pop("session_id", None)
    return volunteer_locations.submit(database, current_user, case_id, UUID(str(session_id)), VolunteerLocationCreate.model_validate(payload))


def _process_one(database: Database, current_user: CurrentUser, operation: dict) -> dict:
    queue_id = str(operation["id"])
    processing = database.update_sync_queue(str(current_user.profile_id), queue_id, {"status": SyncStatus.PROCESSING.value, "attempt_count": int(operation.get("attempt_count") or 0) + 1, "last_attempt_at": _now(), "error_message": None})
    try:
        _execute(database, current_user, processing)
        return database.update_sync_queue(str(current_user.profile_id), queue_id, {"status": SyncStatus.SYNCED.value, "synced_at": _now()})
    except DatabaseError as error:
        return database.update_sync_queue(str(current_user.profile_id), queue_id, {"status": SyncStatus.FAILED.value, "error_message": "Operation could not be applied."})
    except Exception as error:
        conflict = isinstance(error, HTTPException) and error.status_code in {403, 404, 409}
        return database.update_sync_queue(str(current_user.profile_id), queue_id, {"status": SyncStatus.CONFLICT.value if conflict else SyncStatus.FAILED.value, "error_message": _safe_error(error)})


def process(database: Database, current_user: CurrentUser, device_session_id: UUID, limit: int) -> list[dict]:
    _active_verified(current_user)
    if limit < 1 or limit > MAX_PROCESS_LIMIT:
        raise HTTPException(status_code=422, detail=f"limit must be between 1 and {MAX_PROCESS_LIMIT}.")
    try:
        operations = database.list_sync_queue(str(current_user.profile_id), _device(device_session_id), SyncStatus.PENDING.value, limit)
        return [_process_one(database, current_user, operation) for operation in operations]
    except DatabaseError as error:
        raise _db_error(error) from error


def status_summary(database: Database, current_user: CurrentUser, device_session_id: UUID) -> dict:
    _active_verified(current_user)
    try:
        rows = database.list_sync_queue(str(current_user.profile_id), _device(device_session_id), limit=MAX_HISTORY_LIMIT)
        return {f"{queue_status.lower()}_count": sum(row.get("status") == queue_status for row in rows) for queue_status in SyncStatus}
    except DatabaseError as error:
        raise _db_error(error) from error


def history(database: Database, current_user: CurrentUser, device_session_id: UUID, limit: int, queue_status: SyncStatus | None) -> list[dict]:
    _active_verified(current_user)
    if limit < 1 or limit > MAX_HISTORY_LIMIT:
        raise HTTPException(status_code=422, detail=f"limit must be between 1 and {MAX_HISTORY_LIMIT}.")
    try:
        return database.list_sync_queue(str(current_user.profile_id), _device(device_session_id), queue_status.value if queue_status else None, limit)
    except DatabaseError as error:
        raise _db_error(error) from error


def retry(database: Database, current_user: CurrentUser, device_session_id: UUID, queue_id: UUID) -> dict:
    _active_verified(current_user)
    try:
        operation = database.sync_queue_by_id(str(current_user.profile_id), str(queue_id))
        if not operation or str(operation.get("device_session_id")) != _device(device_session_id):
            raise HTTPException(status_code=404, detail="Sync operation not found.")
        if operation.get("status") not in {SyncStatus.FAILED.value, SyncStatus.CONFLICT.value}:
            raise HTTPException(status_code=409, detail="Only failed or conflicting operations can be retried.")
        return database.update_sync_queue(str(current_user.profile_id), str(queue_id), {"status": SyncStatus.PENDING.value, "error_message": None, "last_attempt_at": None})
    except DatabaseError as error:
        raise _db_error(error) from error