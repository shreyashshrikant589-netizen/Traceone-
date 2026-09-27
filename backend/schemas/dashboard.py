from typing import Any

from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_members: int
    active_members: int
    total_zones: int
    unsearched_zones: int
    in_progress_zones: int
    searched_zones: int
    active_search_sessions: int
    completed_search_sessions: int
    evidence_count: int
    witness_report_count: int
    report_count: int
    pending_reports: int
    possible_match_count: int
    pending_police_notifications: int
    active_publication: bool


class DashboardResponse(BaseModel):
    case: dict[str, Any]
    missing_person: dict[str, Any] | None = None
    stats: DashboardStats
    search: dict[str, Any]
    intelligence: dict[str, Any]
    safety: dict[str, Any]
    recent_activity: list[dict[str, Any]]