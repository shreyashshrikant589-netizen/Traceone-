from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class InviteCreate(BaseModel):
    expires_at: datetime
    max_uses: int | None = Field(default=1, gt=0)


class InviteResponse(BaseModel):
    invite_id: UUID
    case_id: UUID
    join_code: str
    invite_token: str
    expires_at: datetime
    max_uses: int | None


class JoinCredential(BaseModel):
    join_code: str | None = Field(default=None, min_length=6, max_length=6)
    invite_token: str | None = Field(default=None, min_length=16)

    @model_validator(mode="after")
    def require_one_credential(self) -> "JoinCredential":
        if bool(self.join_code) == bool(self.invite_token):
            raise ValueError("Provide exactly one join_code or invite_token.")
        return self


class InvitePreviewResponse(BaseModel):
    case_id: UUID
    case_number: str
    title: str
    event_name: str | None = None
    venue_name: str | None = None
    status: str
    invite_valid: bool
    expires_at: datetime


class JoinResponse(BaseModel):
    case_id: UUID
    membership_id: UUID
    role: str
    status: str
    joined_at: datetime
