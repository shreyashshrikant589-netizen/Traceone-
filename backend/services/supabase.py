"""Centralized server-side Supabase client creation."""

from __future__ import annotations

from functools import lru_cache

from supabase import Client, create_client

from backend.config import Settings, get_settings


class SupabaseConfigurationError(RuntimeError):
    """Raised when required server-side Supabase configuration is missing."""


def create_supabase_client(settings: Settings) -> Client:
    """Create a server-side client from validated application settings."""
    missing: list[str] = []
    if not settings.supabase_url:
        missing.append("SUPABASE_URL")
    if not settings.supabase_service_role_key:
        missing.append("SUPABASE_SERVICE_ROLE_KEY")

    if missing:
        variables = ", ".join(missing)
        raise SupabaseConfigurationError(
            f"Supabase server configuration is incomplete. Missing: {variables}."
        )

    return create_client(settings.supabase_url, settings.supabase_service_role_key)


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    """Return the process-wide server-side Supabase client.

    Client creation is lazy so the health endpoints remain available when the
    optional database configuration has not yet been supplied.
    """
    return create_supabase_client(get_settings())