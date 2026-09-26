from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CaseMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    case_id: UUID
    user_id: UUID
    role: str
    status: str
    joined_at: datetime | None = None
    left_at: datetime | None = None
    created_at: datetime
    updated_at: datetime | None = None
