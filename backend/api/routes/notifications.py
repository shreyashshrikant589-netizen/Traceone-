from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from backend.dependencies import get_database
from backend.schemas.notifications import NotificationResponse, NotificationStatus, NotificationType, UnreadCountResponse
from backend.security.auth import CurrentUser, require_active_user
from backend.services.database import Database, DatabaseError

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationResponse])
def list_notifications(notification_status: NotificationStatus | None = None, case_id: UUID | None = None, limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0), current_user: CurrentUser = Depends(require_active_user), database: Database = Depends(get_database)) -> list[NotificationResponse]:
    try:
        rows = database.list_notifications(str(current_user.profile_id), notification_status.value if notification_status else None, str(case_id) if case_id else None, limit, offset)
        return [NotificationResponse.model_validate(row) for row in rows]
    except DatabaseError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Notifications unavailable.") from error


@router.get("/unread-count", response_model=UnreadCountResponse)
def unread_count(current_user: CurrentUser = Depends(require_active_user), database: Database = Depends(get_database)) -> UnreadCountResponse:
    try:
        return UnreadCountResponse(count=database.unread_notification_count(str(current_user.profile_id)))
    except DatabaseError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Notifications unavailable.") from error


@router.patch("/read-all", response_model=list[NotificationResponse])
def read_all(current_user: CurrentUser = Depends(require_active_user), database: Database = Depends(get_database)) -> list[NotificationResponse]:
    try:
        rows = database.mark_all_notifications_read(str(current_user.profile_id), _now())
        return [NotificationResponse.model_validate(row) for row in rows]
    except DatabaseError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Notifications unavailable.") from error


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_read(notification_id: UUID, current_user: CurrentUser = Depends(require_active_user), database: Database = Depends(get_database)) -> NotificationResponse:
    try:
        notification = database.notification_by_id(str(notification_id))
        if not notification or str(notification.get("user_id")) != str(current_user.profile_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")
        if notification.get("status") == NotificationStatus.READ.value:
            return NotificationResponse.model_validate(notification)
        return NotificationResponse.model_validate(database.mark_notification_read(str(notification_id), _now()))
    except DatabaseError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Notifications unavailable.") from error


def _now() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()
