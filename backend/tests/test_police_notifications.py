import unittest
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException

from backend.schemas.common import UserRole
from backend.schemas.police_notifications import PoliceNotificationStatus
from backend.security.auth import CurrentUser
from backend.services import police_notifications

CASE_ID = UUID("33333333-3333-3333-3333-333333333333")
OTHER_CASE_ID = UUID("44444444-4444-4444-4444-444444444444")
MANAGER_ID = UUID("11111111-1111-1111-1111-111111111111")
VOLUNTEER_ID = UUID("22222222-2222-2222-2222-222222222222")


def current(role: UserRole, profile_id: UUID = MANAGER_ID, active: bool = True, verified: bool = True) -> CurrentUser:
    return CurrentUser(UUID("55555555-5555-5555-5555-555555555555"), {"id": str(profile_id), "role": role, "is_active": active, "is_verified": verified})


class FakeDatabase:
    def __init__(self) -> None:
        self.cases = {
            str(CASE_ID): {"id": str(CASE_ID), "created_by": str(MANAGER_ID), "case_manager_id": str(MANAGER_ID), "status": "PUBLIC_SEARCH"},
            str(OTHER_CASE_ID): {"id": str(OTHER_CASE_ID), "created_by": str(MANAGER_ID), "case_manager_id": str(MANAGER_ID), "status": "PUBLIC_SEARCH"},
        }
        self.rows = []
        self.timeline = []
        self.notifications = []

    def case_by_id(self, case_id: str) -> dict | None:
        return self.cases.get(case_id)

    def list_police_notifications(self, case_id: str, notification_status: str | None = None) -> list[dict]:
        return [row for row in self.rows if row["case_id"] == case_id and (notification_status is None or row["status"] == notification_status)]

    def create_police_notification(self, values: dict) -> dict:
        row = {"created_at": datetime.now(timezone.utc).isoformat(), **values}
        self.rows.append(row)
        return row

    def police_notification_by_reference(self, case_id: str, reference_id: str) -> dict | None:
        return next((row for row in self.rows if row["case_id"] == case_id and row["reference_id"] == reference_id), None)

    def update_police_notification(self, case_id: str, reference_id: str, values: dict) -> dict:
        row = self.police_notification_by_reference(case_id, reference_id)
        row.update(values)
        return row

    def create_timeline_event(self, values: dict) -> dict:
        self.timeline.append(values)
        return values

    def create_notification(self, values: dict) -> dict:
        self.notifications.append(values)
        return values

    def list_active_profiles(self, role: str) -> list[dict]:
        return [{"id": str(UUID("66666666-6666-6666-6666-666666666666")), "role": role, "is_active": True, "is_verified": True}]


class PoliceNotificationTests(unittest.TestCase):
    def test_manager_request_is_pending_and_server_owned(self) -> None:
        database = FakeDatabase()
        result = police_notifications.request(database, current(UserRole.CASE_MANAGER), CASE_ID)
        self.assertEqual(result["status"], "PENDING")
        self.assertEqual(result["requested_by"], str(MANAGER_ID))
        self.assertRegex(result["reference_id"], r"^TRC-POL-[A-Z0-9]{8}$")
        self.assertIsNone(result["notified_at"])
        self.assertEqual(database.timeline[-1]["event_type"], "POLICE_NOTIFIED")
        self.assertTrue(any(item["type"] == "POLICE_UPDATE" for item in database.notifications))

    def test_volunteer_and_unverified_users_are_rejected(self) -> None:
        database = FakeDatabase()
        with self.assertRaisesRegex(HTTPException, "authorized"):
            police_notifications.request(database, current(UserRole.VOLUNTEER, VOLUNTEER_ID), CASE_ID)
        with self.assertRaises(HTTPException):
            police_notifications.request(database, current(UserRole.CASE_MANAGER, active=False), CASE_ID)
        with self.assertRaises(HTTPException):
            police_notifications.request(database, current(UserRole.CASE_MANAGER, verified=False), CASE_ID)

    def test_duplicate_active_request_is_rejected(self) -> None:
        database = FakeDatabase()
        police_notifications.request(database, current(UserRole.CASE_MANAGER), CASE_ID)
        with self.assertRaisesRegex(HTTPException, "already exists"):
            police_notifications.request(database, current(UserRole.CASE_MANAGER), CASE_ID)

    def test_lifecycle_and_invalid_transitions(self) -> None:
        database = FakeDatabase()
        created = police_notifications.request(database, current(UserRole.CASE_MANAGER), CASE_ID)
        reference = created["reference_id"]
        with self.assertRaisesRegex(HTTPException, "Cannot close"):
            police_notifications.close(database, current(UserRole.CASE_MANAGER), CASE_ID, reference)
        notified = police_notifications.mark_notified(database, current(UserRole.CASE_MANAGER), CASE_ID, reference)
        self.assertEqual(notified["status"], PoliceNotificationStatus.NOTIFIED)
        self.assertIsNotNone(notified["notified_at"])
        with self.assertRaisesRegex(HTTPException, "Cannot change"):
            police_notifications.mark_notified(database, current(UserRole.CASE_MANAGER), CASE_ID, reference)
        acknowledged = police_notifications.acknowledge(database, current(UserRole.CASE_MANAGER), CASE_ID, reference)
        self.assertEqual(acknowledged["status"], PoliceNotificationStatus.ACKNOWLEDGED)
        closed = police_notifications.close(database, current(UserRole.CASE_MANAGER), CASE_ID, reference)
        self.assertEqual(closed["status"], PoliceNotificationStatus.CLOSED)
        with self.assertRaisesRegex(HTTPException, "Cannot change"):
            police_notifications.acknowledge(database, current(UserRole.CASE_MANAGER), CASE_ID, reference)

    def test_pending_can_only_close_through_cancel(self) -> None:
        database = FakeDatabase()
        reference = police_notifications.request(database, current(UserRole.CASE_MANAGER), CASE_ID)["reference_id"]
        cancelled = police_notifications.cancel(database, current(UserRole.CASE_MANAGER), CASE_ID, reference)
        self.assertEqual(cancelled["status"], "CLOSED")
        self.assertIsNotNone(cancelled["closed_at"])
        with self.assertRaisesRegex(HTTPException, "Cannot change"):
            police_notifications.cancel(database, current(UserRole.CASE_MANAGER), CASE_ID, reference)

    def test_case_scoping_and_listing(self) -> None:
        database = FakeDatabase()
        created = police_notifications.request(database, current(UserRole.CASE_MANAGER), CASE_ID)
        self.assertEqual(len(police_notifications.list_notifications(database, current(UserRole.CASE_MANAGER), CASE_ID, None)), 1)
        with self.assertRaisesRegex(HTTPException, "not found"):
            police_notifications.get(database, current(UserRole.CASE_MANAGER), OTHER_CASE_ID, created["reference_id"])
        with self.assertRaisesRegex(HTTPException, "authorized"):
            police_notifications.list_notifications(database, current(UserRole.VOLUNTEER, VOLUNTEER_ID), CASE_ID, None)


if __name__ == "__main__":
    unittest.main()