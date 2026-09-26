from datetime import datetime, timezone
from uuid import UUID

from backend.schemas.notifications import NotificationType
from backend.services.database import Database, DatabaseError


def create_notification(database: Database, user_id: UUID, case_id: UUID | None, notification_type: NotificationType, title: str, message: str, data: dict) -> dict | None:
    values = {"user_id": str(user_id), "case_id": str(case_id) if case_id else None, "type": notification_type.value, "title": title, "message": message, "data": data, "status": "PENDING"}
    try:
        return database.create_notification(values)
    except Exception:
        return None


def notify_case_managers(database: Database, case: dict, case_id: UUID, notification_type: NotificationType, title: str, message: str, data: dict) -> None:
    recipients = {str(case.get("created_by")), str(case.get("case_manager_id"))}
    for recipient in recipients:
        if recipient and recipient != "None":
            create_notification(database, UUID(recipient), case_id, notification_type, title, message, data)


def notify_active_members(database: Database, case_id: UUID, notification_type: NotificationType, title: str, message: str, data: dict) -> None:
    try:
        members = database.list_case_members(str(case_id))
    except Exception:
        return
    for member in members:
        if member.get("status") in {"LEFT", "REMOVED"} or member.get("left_at") is not None:
            continue
        create_notification(database, UUID(str(member["user_id"])), case_id, notification_type, title, message, data)
