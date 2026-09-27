"""Shared FastAPI dependency hooks for future backend phases."""

from collections.abc import Generator

from fastapi import Depends
from supabase import Client

from backend.services.supabase import get_supabase
from backend.services.database import Database


def request_context() -> Generator[None, None, None]:
    """Placeholder dependency boundary; authentication is intentionally not implemented."""
    yield None


def get_supabase_dependency() -> Client:
    """Provide the centralized server-side client to future routers."""
    return get_supabase()


def get_database(client: Client = Depends(get_supabase_dependency)) -> Database:
    """Provide the database access boundary backed by the centralized client."""
    return Database(client)
