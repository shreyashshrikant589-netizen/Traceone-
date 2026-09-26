import unittest
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from fastapi.testclient import TestClient

from backend.main import app
from backend.schemas.common import UserRole
from backend.schemas.notifications import NotificationType
from backend.schemas.timeline import TimelineEventType
from backend.security.auth import CurrentUser
from backend.services import notifications, timeline

PROFILE_ID = UUID("11111111-1111-1111-1111-111111111111")
OTHER_ID = UUID("66666666-6666-6666-6666-666666666666")
CASE_ID = UUID("33333333-3333-3333-3333-333333333333")
NOTIFICATION_ID = UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")


def current(profile_id: UUID = PROFILE_ID) -> CurrentUser:
    return CurrentUser(UUID("22222222-2222-2222-2222-222222222222"), {"id": str(profile_id), "role": UserRole.VOLUNTEER, "is_active": True, "is_verified": True})


class FakeDatabase:
    def __init__(self) -> None:
        self.timeline_rows = []
        self.notifications = [
            {"id": str(NOTIFICATION_ID), "user_id": str(PROFILE_ID), "case_id": str(CASE_ID), "type": "NEW_EVIDENCE", "title": "Evidence", "message": "New evidence", "data": {}, "status": "PENDING", "sent_at": None, "read_at": None, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": "other", "user_id": str(OTHER_ID), "case_id": str(CASE_ID), "type": "NEW_EVIDENCE", "title": "Other", "message": "Other", "data": {}, "status": "PENDING", "sent_at": None, "read_at": None, "created_at": datetime.now(timezone.utc).isoformat()},
        ]

    def create_timeline_event(self, values: dict) -> dict:
        row = {"id": "timeline-1", **values}
        self.timeline_rows.append(row)
        return row

    def list_timeline(self, case_id: str, limit: int, offset: int) -> list[dict]:
        return self.timeline_rows[offset:offset + limit]

    def create_notification(self, values: dict) -> dict:
        row = {"id": str(NOTIFICATION_ID), "created_at": datetime.now(timezone.utc).isoformat(), "sent_at": None, "read_at": None, **values}
        self.notifications.append(row)
        return row

    def list_notifications(self, user_id: str, notification_status: str | None, case_id: str | None, limit: int, offset: int) -> list[dict]:
        rows = [row for row in self.notifications if row["user_id"] == user_id]
        if notification_status:
            rows = [row for row in rows if row["status"] == notification_status]
        return rows[offset:offset + limit]

    def unread_notification_count(self, user_id: str) -> int:
        return sum(1 for row in self.notifications if row["user_id"] == user_id and row["status"] != "READ")

    def notification_by_id(self, notification_id: str) -> dict | None:
        return next((row for row in self.notifications if row["id"] == notification_id), None)

    def mark_notification_read(self, notification_id: str, read_at: str) -> dict:
        row = self.notification_by_id(notification_id)
        row.update({"status": "READ", "read_at": read_at})
        return row

    def mark_all_notifications_read(self, user_id: str, read_at: str) -> list[dict]:
        rows = [row for row in self.notifications if row["user_id"] == user_id and row["status"] != "READ"]
        for row in rows:
            row.update({"status": "READ", "read_at": read_at})
        return rows


class TimelineNotificationTests(unittest.TestCase):
    def test_unauthenticated_routes_rejected(self) -> None:
        client = TestClient(app)
        self.assertEqual(client.get(f"/api/v1/cases/{CASE_ID}/timeline").status_code, 401)
        self.assertEqual(client.get("/api/v1/notifications").status_code, 401)

    def test_timeline_event_validates_and_serializes_metadata(self) -> None:
        database = FakeDatabase()
        result = timeline.create_timeline_event(database, CASE_ID, TimelineEventType.EVIDENCE_ADDED, PROFILE_ID, "Added", {"evidence_id": "e1"})
        self.assertEqual(result["event_type"], "EVIDENCE_ADDED")
        self.assertEqual(result["metadata"]["evidence_id"], "e1")

    def test_notification_is_user_scoped_and_unread_counted(self) -> None:
        database = FakeDatabase()
        self.assertEqual(len(database.list_notifications(str(PROFILE_ID), None, None, 50, 0)), 1)
        self.assertEqual(database.unread_notification_count(str(PROFILE_ID)), 1)
        self.assertEqual(database.unread_notification_count(str(OTHER_ID)), 1)
        notifications.create_notification(database, PROFILE_ID, CASE_ID, NotificationType.NEW_EVIDENCE, "Title", "Message", {"evidence_id": "e1"})
        self.assertEqual(len(database.list_notifications(str(PROFILE_ID), None, None, 50, 0)), 2)

    def test_notification_owner_and_read_all_scope(self) -> None:
        database = FakeDatabase()
        with self.assertRaises(AttributeError):
            _ = database.notification_by_id("missing").get("user_id")
        row = database.notification_by_id(str(NOTIFICATION_ID))
        self.assertEqual(row["user_id"], str(PROFILE_ID))
        database.mark_all_notifications_read(str(PROFILE_ID), datetime.now(timezone.utc).isoformat())
        self.assertEqual(database.unread_notification_count(str(PROFILE_ID)), 0)
        self.assertEqual(database.unread_notification_count(str(OTHER_ID)), 1)


if __name__ == "__main__":
    unittest.main()
