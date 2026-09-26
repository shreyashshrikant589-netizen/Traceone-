from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from backend.schemas.common import UserRole


class ProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    auth_user_id: UUID
    full_name: str
    phone: str | None = None
    email: str | None = None
    role: UserRole
    avatar_url: str | None = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
