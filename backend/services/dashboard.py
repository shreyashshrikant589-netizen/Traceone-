from uuid import UUID

from fastapi import HTTPException, status

from backend.schemas.common import UserRole
from backend.security.auth import CurrentUser, can_manage_case
from backend.services.database import Database, DatabaseError

MAX_LIMIT = 100


def _db_error(error: DatabaseError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database operation failed.")


def _case(database: Database, case_id: UUID, current_user: CurrentUser) -> dict:
    case = database.case_by_id(str(case_id))
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")
    if not current_user.profile.get("is_active", False) or not current_user.profile.get("is_verified", False):
        raise HTTPException(status_code=403, detail="Active verified account required.")
    if current_user.role != UserRole.SUPER_ADMIN and not can_manage_case(current_user, case):
        raise HTTPException(status_code=403, detail="Only an authorized case manager can access the dashboard.")
    return case


def _bounded(limit: int) -> int:
    if limit < 1 or limit > MAX_LIMIT:
        raise HTTPException(status_code=422, detail=f"limit must be between 1 and {MAX_LIMIT}.")
    return limit


def _latest_priorities(rows: list[dict]) -> list[dict]:
    latest: dict[str, dict] = {}
    for row in rows:
        latest.setdefault(str(row.get("zone_id")), row)
    return sorted(latest.values(), key=lambda row: (row.get("rank") or 999, str(row.get("zone_id"))))


def _data(database: Database, case_id: UUID, current_user: CurrentUser, limit: int) -> dict:
    case = _case(database, case_id, current_user)
    case_key = str(case_id)
    members = database.list_case_members(case_key)
    zones = database.list_zones(case_key)
    sessions = database.list_sessions(case_key)
    active_sessions = [row for row in sessions if row.get("status") == "ACTIVE"]
    completed_sessions = [row for row in sessions if row.get("status") == "COMPLETED"]
    evidence = database.list_evidence(case_key)
    witnesses = database.list_witness_reports(case_key)
    reports = database.list_reports(case_key)
    matches = database.list_possible_matches(case_key)
    police = database.list_police_notifications(case_key)
    publications = database.list_case_publications(case_key, "PUBLIC", "ACTIVE")
    priorities = _latest_priorities(database.list_ai_search_priorities(case_key))
    timeline = database.list_timeline(case_key, limit, 0)
    active_locations = database.list_volunteer_locations(case_key, [str(row["id"]) for row in active_sessions], limit=limit)
    expansion_history = database.list_search_expansions(case_key)
    latest_expansion = expansion_history[0] if expansion_history else None
    assigned_zones = {str(row.get("assigned_volunteer_id")): row for row in zones if row.get("assigned_volunteer_id")}
    session_by_volunteer = {str(row.get("volunteer_id")): row for row in active_sessions}
    location_by_volunteer = {}
    for location in active_locations:
        location_by_volunteer.setdefault(str(location.get("volunteer_id")), location)
    volunteer_snapshot = []
    for member in members:
        user_id = str(member.get("user_id"))
        zone = assigned_zones.get(user_id)
        session = session_by_volunteer.get(user_id)
        location = location_by_volunteer.get(user_id)
        volunteer_snapshot.append({"user_id": member.get("user_id"), "role": member.get("role"), "status": member.get("status"), "joined_at": member.get("joined_at"), "assigned_zone_id": zone.get("id") if zone else None, "active_session_id": session.get("id") if session else None, "latest_location_recorded_at": location.get("recorded_at") if location else None})
    stats = {"total_members": len(members), "active_members": sum(row.get("status") == "ACTIVE" and row.get("left_at") is None for row in members), "total_zones": len(zones), "unsearched_zones": sum(row.get("status") in {"UNSEARCHED", "REOPEN"} for row in zones), "in_progress_zones": sum(row.get("status") in {"ASSIGNED", "IN_PROGRESS"} for row in zones), "searched_zones": sum(row.get("status") == "SEARCHED" for row in zones), "active_search_sessions": len(active_sessions), "completed_search_sessions": len(completed_sessions), "evidence_count": len(evidence), "witness_report_count": len(witnesses), "report_count": len(reports), "pending_reports": sum(row.get("status") == "PENDING" for row in reports), "possible_match_count": len(matches), "pending_police_notifications": sum(row.get("status") in {"PENDING", "NOTIFIED", "ACKNOWLEDGED"} for row in police), "active_publication": bool(publications)}
    search = {"zones": zones, "active_sessions": active_sessions, "active_volunteer_locations": active_locations, "volunteers": volunteer_snapshot}
    intelligence = {"ai_priorities": priorities, "top_priority_zones": priorities[:5], "evidence_graph_summary": {"nodes": len(database.list_evidence_graph_nodes(case_key)), "edges": len(database.list_evidence_graph_edges(case_key))}, "possible_matches": matches, "search_expansion": latest_expansion}
    safety = {"police_notifications": police, "public_status": {"is_public": bool(case.get("is_public")), "public_at": case.get("public_at"), "active_publication": bool(publications)}}
    return {"case": case, "missing_person": None, "stats": stats, "search": search, "intelligence": intelligence, "safety": safety, "recent_activity": timeline}


def overview(database: Database, current_user: CurrentUser, case_id: UUID) -> dict:
    try:
        return _data(database, case_id, current_user, 20)
    except DatabaseError as error:
        raise _db_error(error) from error


def stats(database: Database, current_user: CurrentUser, case_id: UUID) -> dict:
    try:
        return _data(database, case_id, current_user, 1)["stats"]
    except DatabaseError as error:
        raise _db_error(error) from error


def live_search(database: Database, current_user: CurrentUser, case_id: UUID) -> dict:
    try:
        data = _data(database, case_id, current_user, 100)
        return {"active_volunteers": data["search"]["volunteers"], "active_search_sessions": data["search"]["active_sessions"], "assigned_zones": [zone for zone in data["search"]["zones"] if zone.get("assigned_volunteer_id")], "latest_volunteer_locations": data["search"]["active_volunteer_locations"], "zone_status": data["search"]["zones"]}
    except DatabaseError as error:
        raise _db_error(error) from error


def intelligence(database: Database, current_user: CurrentUser, case_id: UUID) -> dict:
    try:
        data = _data(database, case_id, current_user, 20)
        return data["intelligence"]
    except DatabaseError as error:
        raise _db_error(error) from error


def activity(database: Database, current_user: CurrentUser, case_id: UUID, limit: int) -> list[dict]:
    try:
        return _data(database, case_id, current_user, _bounded(limit))["recent_activity"]
    except DatabaseError as error:
        raise _db_error(error) from error


def volunteers(database: Database, current_user: CurrentUser, case_id: UUID) -> list[dict]:
    try:
        return _data(database, case_id, current_user, 100)["search"]["volunteers"]
    except DatabaseError as error:
        raise _db_error(error) from error


def control(database: Database, current_user: CurrentUser, case_id: UUID) -> dict:
    try:
        data = _data(database, case_id, current_user, 1)
        case = data["case"]
        return {"case_status": case.get("status"), "is_public": case.get("is_public"), "case_settings": database.case_settings_by_case_id(str(case_id)), "current_radius_m": case.get("current_radius_m"), "latest_expansion": data["intelligence"]["search_expansion"], "police_notifications": data["safety"]["police_notifications"], "active_publication": data["safety"]["public_status"]["active_publication"], "resolved_at": case.get("resolved_at"), "closed_at": case.get("closed_at"), "latest_timeline_event": data["recent_activity"][0] if data["recent_activity"] else None}
    except DatabaseError as error:
        raise _db_error(error) from error