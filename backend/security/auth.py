from dataclasses import dataclass
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client

from backend.services.supabase import SupabaseConfigurationError, get_supabase
from backend.services.database import DatabaseError
from backend.schemas.common import UserRole

bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    auth_user_id: UUID
    profile: dict

    @property
    def profile_id(self) -> UUID:
        return UUID(str(self.profile["id"]))

    @property
    def role(self) -> UserRole:
        return UserRole(str(self.profile["role"]))


def _unauthorized(detail: str = "Authentication required.") -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail, headers={"WWW-Authenticate": "Bearer"})


def _load_profile(client: Client, auth_user_id: UUID, auth_user: object = None) -> dict:
    try:
        response = (
            client.table("profiles")
            .select("id, auth_user_id, full_name, phone, email, role, avatar_url, is_active, is_verified, created_at, updated_at")
            .eq("auth_user_id", str(auth_user_id))
            .single()
            .execute()
        )
        if getattr(response, "error", None) is None and response.data:
            return response.data
    except Exception:
        pass

    if auth_user is not None:
        user_meta = getattr(auth_user, "user_metadata", None) or {}
        email = getattr(auth_user, "email", None)
        full_name = user_meta.get("full_name") or (email.split("@")[0] if email else "Volunteer")
        phone = user_meta.get("phone")
        new_profile = {
            "auth_user_id": str(auth_user_id),
            "full_name": full_name,
            "email": email,
            "phone": phone,
            "role": "VOLUNTEER",
            "is_active": True,
            "is_verified": True,
        }
        try:
            insert_res = client.table("profiles").insert(new_profile).execute()
            if insert_res and getattr(insert_res, "data", None):
                return insert_res.data[0]
        except Exception:
            pass

    raise _unauthorized("Authenticated user has no profile.")


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> CurrentUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise _unauthorized()

    try:
        client: Client = get_supabase()
        auth_response = client.auth.get_user(credentials.credentials)
        auth_user = auth_response.user
        if auth_user is None:
            raise _unauthorized("Invalid authentication token.")
        auth_user_id = UUID(str(auth_user.id))
        profile = _load_profile(client, auth_user_id, auth_user=auth_user)
        return CurrentUser(auth_user_id=auth_user_id, profile=profile)
    except HTTPException:
        raise
    except SupabaseConfigurationError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Supabase authentication is not configured.") from error
    except DatabaseError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Profile lookup is unavailable.") from error
    except Exception as error:
        if error.__class__.__name__ in {"AuthApiError", "AuthInvalidTokenError"}:
            raise _unauthorized("Invalid authentication token.") from error
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token.") from error


def require_active_user(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if not current_user.profile.get("is_active", False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Active account required.")
    return current_user


def require_verified_user(current_user: CurrentUser = Depends(require_active_user)) -> CurrentUser:
    if not current_user.profile.get("is_verified", False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Verified account required.")
    return current_user


def require_roles(*roles: UserRole):
    def dependency(current_user: CurrentUser = Depends(require_active_user)) -> CurrentUser:
        if current_user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized for this action.")
        return current_user

    return dependency


def can_manage_case(current_user: CurrentUser, case: dict) -> bool:
    profile_id = str(current_user.profile_id)
    return (
        current_user.role == UserRole.SUPER_ADMIN
        or str(case.get("case_manager_id")) == profile_id
        or str(case.get("created_by")) == profile_id
    )
