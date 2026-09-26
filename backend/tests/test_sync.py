import unittest
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException

from backend.schemas.common import UserRole
from backend.schemas.sync import SyncEntityType, SyncOperationType, SyncQueueCreate, SyncStatus
from backend.security.auth import CurrentUser
from backend.services import sync

CASE_ID = UUID("33333333-3333-3333-3333-333333333333")
DEVICE_ID = UUID("11111111-1111-1111-1111-111111111111")
OTHER_DEVICE_ID = UUID("22222222-2222-2222-2222-222222222222")
USER_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
OTHER_USER_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")


def current(profile_id: UUID = USER_ID, active: bool = True, verified: bool = True) -> CurrentUser:
    return CurrentUser(UUID("cccccccc-cccc-cccc-cccc-cccccccccccc"), {"id": str(profile_id), "role": UserRole.VOLUNTEER, "is_active": active, "is_verified": verified})


def create_payload(operation_id: UUID | None = None, payload: dict | None = None) -> SyncQueueCreate:
    return SyncQueueCreate(client_operation_id=operation_id or UUID("dddddddd-dddd-dddd-dddd-dddddddddddd"), operation_type=SyncOperationType.CREATE_REPORT, entity_type=SyncEntityType.REPORTS, payload=payload or {"case_id": str(CASE_ID), "report_type": "SIGHTING", "description": "Seen"})


class FakeDatabase:
    def __init__(self) -> None:
        self.rows = []
        self.created_reports = []
        self.case = {"id": str(CASE_ID), "created_by": str(USER_ID), "case_manager_id": str(USER_ID)}

    def sync_queue_by_operation(self, user_id: str, client_operation_id: str) -> dict | None:
        return next((row for row in self.rows if row["user_id"] == user_id and row["client_operation_id"] == client_operation_id), None)

    def create_sync_queue(self, values: dict) -> dict:
        row = {"id": str(UUID(int=len(self.rows) + 1)), "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat(), **values}
        self.rows.append(row)
        return row

    def list_sync_queue(self, user_id: str, device_session_id=None, queue_status=None, limit=100) -> list[dict]:
        rows = [row for row in self.rows if row["user_id"] == user_id and (device_session_id is None or row["device_session_id"] == device_session_id) and (queue_status is None or row["status"] == queue_status)]
        return rows[:limit]

    def sync_queue_by_id(self, user_id: str, queue_id: str) -> dict | None:
        return next((row for row in self.rows if row["user_id"] == user_id and row["id"] == queue_id), None)

    def update_sync_queue(self, user_id: str, queue_id: str, values: dict) -> dict:
        row = self.sync_queue_by_id(user_id, queue_id)
        row.update(values)
        return row

    def case_by_id(self, case_id: str) -> dict | None:
        return self.case if case_id == str(CASE_ID) else None

    def list_case_memberships_for_user(self, profile_id: str) -> list[dict]:
        return [{"case_id": str(CASE_ID), "user_id": profile_id, "status": "ACTIVE", "left_at": None}] if profile_id == str(USER_ID) else []

    def create_report(self, values: dict) -> dict:
        self.created_reports.append(values)
        return {"id": str(UUID("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")), **values}

    def create_timeline_event(self, values: dict) -> dict:
        return values

    def create_notification(self, values: dict) -> dict:
        return values


class SyncTests(unittest.TestCase):
    def test_authenticated_queue_is_server_owned_and_idempotent(self) -> None:
        database = FakeDatabase()
        first = sync.queue(database, current(), DEVICE_ID, create_payload())
        second = sync.queue(database, current(), OTHER_DEVICE_ID, create_payload())
        self.assertEqual(first["id"], second["id"])
        self.assertEqual(first["user_id"], str(USER_ID))
        self.assertEqual(first["device_session_id"], str(DEVICE_ID))
        self.assertEqual(first["status"], "PENDING")
        self.assertEqual(len(database.rows), 1)

    def test_unsupported_entity_and_unverified_user_rejected(self) -> None:
        database = FakeDatabase()
        with self.assertRaisesRegex(HTTPException, "do not match"):
            sync.queue(database, current(), DEVICE_ID, SyncQueueCreate(client_operation_id=UUID("ffffffff-ffff-ffff-ffff-ffffffffffff"), operation_type=SyncOperationType.CREATE_REPORT, entity_type=SyncEntityType.EVIDENCE))
        with self.assertRaises(HTTPException):
            sync.queue(database, current(verified=False), DEVICE_ID, create_payload())

    def test_processing_delegates_and_marks_synced(self) -> None:
        database = FakeDatabase()
        sync.queue(database, current(), DEVICE_ID, create_payload())
        processed = sync.process(database, current(), DEVICE_ID, 1)
        self.assertEqual(processed[0]["status"], "SYNCED")
        self.assertEqual(processed[0]["attempt_count"], 1)
        self.assertEqual(database.created_reports[0]["reporter_id"], str(USER_ID))

    def test_lost_case_access_becomes_conflict(self) -> None:
        database = FakeDatabase()
        sync.queue(database, current(), DEVICE_ID, create_payload())
        database.list_case_memberships_for_user = lambda profile_id: []
        result = sync.process(database, current(), DEVICE_ID, 1)[0]
        self.assertEqual(result["status"], "CONFLICT")
        self.assertIn("membership", result["error_message"])

    def test_invalid_location_payload_fails_during_processing(self) -> None:
        database = FakeDatabase()
        operation = SyncQueueCreate(client_operation_id=UUID("99999999-9999-9999-9999-999999999999"), operation_type=SyncOperationType.SUBMIT_LOCATION, entity_type=SyncEntityType.VOLUNTEER_LOCATIONS, entity_id=UUID("88888888-8888-8888-8888-888888888888"), payload={"case_id": str(CASE_ID), "latitude": 100, "longitude": 0, "recorded_at": datetime.now(timezone.utc).isoformat()})
        sync.queue(database, current(), DEVICE_ID, operation)
        result = sync.process(database, current(), DEVICE_ID, 1)[0]
        self.assertEqual(result["status"], "FAILED")
        self.assertEqual(result["error_message"], "Invalid operation payload.")

    def test_status_history_retry_and_bounded_processing_are_user_scoped(self) -> None:
        database = FakeDatabase()
        sync.queue(database, current(), DEVICE_ID, create_payload())
        with self.assertRaisesRegex(HTTPException, "between 1 and 50"):
            sync.process(database, current(), DEVICE_ID, 51)
        database.rows[0]["status"] = "FAILED"
        summary = sync.status_summary(database, current(), DEVICE_ID)
        self.assertEqual(summary["failed_count"], 1)
        retried = sync.retry(database, current(), DEVICE_ID, UUID(database.rows[0]["id"]))
        self.assertEqual(retried["status"], "PENDING")
        with self.assertRaisesRegex(HTTPException, "not found"):
            sync.retry(database, current(OTHER_USER_ID), DEVICE_ID, UUID(database.rows[0]["id"]))


if __name__ == "__main__":
    unittest.main()