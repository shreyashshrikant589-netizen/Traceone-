"""Shared FastAPI dependency hooks for future backend phases."""

from collections.abc import Generator


def request_context() -> Generator[None, None, None]:
    """Placeholder dependency boundary; authentication is intentionally not implemented."""
    yield None
