from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from backend.schemas.timeline import TimelineEventType
from backend.services.database import Database, DatabaseError


def create_timeline_event(database: Database, case_id: UUID, event_type: TimelineEventType, actor_id: UUID | None, description: str | None = None, metadata: dict[str, Any] | None = None) -> dict | None:
    values = {"case_id": str(case_id), "actor_id": str(actor_id) if actor_id else None, "event_type": event_type.value, "description": description, "metadata": metadata or {}, "created_at": datetime.now(timezone.utc).isoformat()}
    try:
        return database.create_timeline_event(values)
    except Exception:
        return None
