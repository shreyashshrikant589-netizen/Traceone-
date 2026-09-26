from fastapi import APIRouter, Depends

from backend.security.auth import CurrentUser, require_active_user
from backend.schemas.profile import ProfileResponse

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/me", response_model=ProfileResponse)
def get_my_profile(current_user: CurrentUser = Depends(require_active_user)) -> ProfileResponse:
    return ProfileResponse.model_validate(current_user.profile)
