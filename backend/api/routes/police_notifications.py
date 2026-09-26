from uuid import UUID

from fastapi import APIRouter, Depends

from backend.dependencies import get_database
from backend.schemas.police_notifications import PoliceNotificationResponse, PoliceNotificationStatus
from backend.security.auth import CurrentUser, require_verified_user
from backend.services import police_notifications as police_service
from backend.services.database import Database

router = APIRouter(prefix="/cases/{case_id}", tags=["police-notifications"])


@router.post("/police-notification/request", response_model=PoliceNotificationResponse, status_code=201)
def request_police_notification(case_id: UUID, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> PoliceNotificationResponse:
    return PoliceNotificationResponse.model_validate(police_service.request(database, current_user, case_id))


@router.get("/police-notifications", response_model=list[PoliceNotificationResponse])
def list_police_notifications(case_id: UUID, notification_status: PoliceNotificationStatus | None = None, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> list[PoliceNotificationResponse]:
    return [PoliceNotificationResponse.model_validate(row) for row in police_service.list_notifications(database, current_user, case_id, notification_status)]


@router.get("/police-notification/{notification_id}", response_model=PoliceNotificationResponse)
def get_police_notification(case_id: UUID, notification_id: str, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> PoliceNotificationResponse:
    return PoliceNotificationResponse.model_validate(police_service.get(database, current_user, case_id, notification_id))


@router.post("/police-notification/{notification_id}/notify", response_model=PoliceNotificationResponse)
def mark_police_notified(case_id: UUID, notification_id: str, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> PoliceNotificationResponse:
    return PoliceNotificationResponse.model_validate(police_service.mark_notified(database, current_user, case_id, notification_id))


@router.post("/police-notification/{notification_id}/acknowledge", response_model=PoliceNotificationResponse)
def acknowledge_police_notification(case_id: UUID, notification_id: str, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> PoliceNotificationResponse:
    return PoliceNotificationResponse.model_validate(police_service.acknowledge(database, current_user, case_id, notification_id))


@router.post("/police-notification/{notification_id}/close", response_model=PoliceNotificationResponse)
def close_police_notification(case_id: UUID, notification_id: str, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> PoliceNotificationResponse:
    return PoliceNotificationResponse.model_validate(police_service.close(database, current_user, case_id, notification_id))


@router.post("/police-notification/{notification_id}/cancel", response_model=PoliceNotificationResponse)
def cancel_police_notification(case_id: UUID, notification_id: str, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> PoliceNotificationResponse:
    return PoliceNotificationResponse.model_validate(police_service.cancel(database, current_user, case_id, notification_id))