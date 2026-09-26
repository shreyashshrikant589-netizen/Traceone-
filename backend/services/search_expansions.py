from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status

from backend.schemas.common import UserRole
from backend.schemas.notifications import NotificationType
from backend.schemas.search_expansions import ExpansionStage, ExpansionStatus
from backend.schemas.timeline import TimelineEventType
from backend.security.auth import CurrentUser, can_manage_case
from backend.services.database import Database, DatabaseError
from backend.services.notifications import notify_case_managers
from backend.services.timeline import create_timeline_event

MODEL_VERSION = "traceone-expansion-baseline-v1"
STAGE_ORDER = [ExpansionStage.EVENT_AREA.value, ExpansionStage.VENUE_PERIMETER.value, ExpansionStage.ROADS_EXITS.value, ExpansionStage.TRANSPORT_NODES.value, ExpansionStage.WIDER_AREA.value]
RADIUS_MULTIPLIERS = {ExpansionStage.EVENT_AREA.value: 1.0, ExpansionStage.VENUE_PERIMETER.value: 1.5, ExpansionStage.ROADS_EXITS.value: 2.0, ExpansionStage.TRANSPORT_NODES.value: 3.0, ExpansionStage.WIDER_AREA.value: 4.0}
MAX_RADIUS_MULTIPLIER = 10.0


def _db_error(error: DatabaseError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database operation failed.")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _case(database: Database, case_id: UUID) -> dict:
    case = database.case_by_id(str(case_id))
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")
    return case


def _active_member(database: Database, case_id: UUID, profile_id: UUID) -> bool:
    return any(str(row.get("case_id")) == str(case_id) and str(row.get("user_id")) == str(profile_id) and row.get("status") == "ACTIVE" and row.get("left_at") is None for row in database.list_case_memberships_for_user(str(profile_id)))


def _authorize(database: Database, current_user: CurrentUser, case_id: UUID, case: dict, manage: bool) -> None:
    if not current_user.profile.get("is_active", False) or not current_user.profile.get("is_verified", False):
        raise HTTPException(status_code=403, detail="Active verified account required.")
    allowed = can_manage_case(current_user, case) if manage else current_user.role == UserRole.SUPER_ADMIN or can_manage_case(current_user, case) or _active_member(database, case_id, current_user.profile_id)
    if not allowed:
        raise HTTPException(status_code=403, detail="You are not authorized for search expansion.")


def _clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, float(value)))


def _next_stage(history: list[dict]) -> str:
    highest = -1
    for row in history:
        if row.get("status") != ExpansionStatus.REJECTED.value:
            highest = max(highest, STAGE_ORDER.index(row["stage"]))
    return STAGE_ORDER[min(highest + 1, len(STAGE_ORDER) - 1)]


def _recommendation(database: Database, case_id: UUID, case: dict, history: list[dict]) -> tuple[str, float, str]:
    zones = database.list_zones(str(case_id))
    priorities = database.list_ai_search_priorities(str(case_id))
    latest = {}
    for row in priorities:
        latest.setdefault(str(row["zone_id"]), row)
    completed_zones = {str(row["zone_id"]) for row in database.list_sessions(str(case_id)) if row.get("status") == "COMPLETED"}
    searched = sum(1 for zone in zones if str(zone.get("id")) in completed_zones or zone.get("status") == "SEARCHED")
    coverage = searched / len(zones) if zones else 0.0
    unsearched_high = sum(1 for zone in zones if str(zone.get("id")) not in completed_zones and float(latest.get(str(zone.get("id")), {}).get("priority_score") or 0) >= 75)
    witnesses = [row for row in database.list_witness_reports(str(case_id)) if row.get("status") == "VERIFIED" and row.get("direction")]
    evidence = [row for row in database.list_evidence(str(case_id)) if row.get("status") == "VERIFIED"]
    graph_nodes = database.list_evidence_graph_nodes(str(case_id))
    exit_nodes = [row for row in graph_nodes if row.get("node_type") in {"EXIT", "CROWD_FLOW"}]
    stage = _next_stage(history)
    reasons = []
    confidence = 0.25
    if coverage >= 0.6:
        reasons.append(f"{round(coverage * 100)}% of current zones have recorded search coverage")
        confidence += 0.25
    if unsearched_high:
        reasons.append(f"{unsearched_high} high-priority zones remain unsearched")
        confidence += 0.15
    if witnesses:
        reasons.append(f"{len(witnesses)} accepted witness report(s) indicate direction")
        confidence += 0.15
    if exit_nodes or any(str(row.get("evidence_type")) in {"EXIT", "CROWD_FLOW"} for row in evidence):
        reasons.append("accepted exit or transport-related evidence is available")
        confidence += 0.15
    if case.get("known_destination"):
        reasons.append("a known destination is available as a search signal")
        confidence += 0.05
    if not reasons:
        reasons.append("available evidence is insufficient for a strong expansion recommendation")
    if coverage < 0.6 and unsearched_high:
        reasons.append("complete high-priority unsearched zones before expanding")
    if len(witnesses) > 1 and len({str(row.get("direction")).upper() for row in witnesses}) > 1:
        reasons.append("accepted witness directions conflict, reducing certainty")
        confidence -= 0.2
    previous = float(case.get("current_radius_m") or case.get("initial_radius_m") or 0)
    if previous <= 0:
        previous = 1.0
    new_radius = min(previous * RADIUS_MULTIPLIERS[stage], previous * MAX_RADIUS_MULTIPLIER)
    reason = f"Expansion recommended toward {stage} using {MODEL_VERSION}. " + "; ".join(reasons) + f" Confidence: {round(_clamp(confidence), 2)}."
    return stage, new_radius, reason


def recommend(database: Database, current_user: CurrentUser, case_id: UUID) -> dict:
    try:
        case = _case(database, case_id)
        _authorize(database, current_user, case_id, case, True)
        history = database.list_search_expansions(str(case_id))
        active = [row for row in history if row.get("status") in {ExpansionStatus.RECOMMENDED.value, ExpansionStatus.APPROVED.value, ExpansionStatus.ACTIVE.value}]
        if active:
            raise HTTPException(status_code=409, detail="An active search expansion recommendation already exists.")
        stage, new_radius, reason = _recommendation(database, case_id, case, history)
        previous = float(case.get("current_radius_m") or case.get("initial_radius_m") or 0) or None
        created = database.create_search_expansion({"case_id": str(case_id), "stage": stage, "previous_radius_m": previous, "new_radius_m": new_radius, "reason": reason, "recommended_by": str(current_user.profile_id), "approved_by": None, "status": ExpansionStatus.RECOMMENDED.value})
        create_timeline_event(database, case_id, TimelineEventType.AI_PRIORITY_UPDATED, current_user.profile_id, "AI search expansion recommendation created.", {"stage": stage, "status": ExpansionStatus.RECOMMENDED.value, "model_version": MODEL_VERSION})
        notify_case_managers(database, case, case_id, NotificationType.SEARCH_EXPANSION, "Search Expansion Recommended", "TraceOne recommends reviewing a search expansion.", {"expansion_id": str(created["id"]), "stage": stage})
        return created
    except DatabaseError as error:
        raise _db_error(error) from error


def list_expansions(database: Database, current_user: CurrentUser, case_id: UUID) -> list[dict]:
    try:
        case = _case(database, case_id)
        _authorize(database, current_user, case_id, case, False)
        return database.list_search_expansions(str(case_id))
    except DatabaseError as error:
        raise _db_error(error) from error


def latest(database: Database, current_user: CurrentUser, case_id: UUID) -> dict:
    rows = list_expansions(database, current_user, case_id)
    if not rows:
        raise HTTPException(status_code=404, detail="Search expansion recommendation not found.")
    return rows[0]


def _transition(database: Database, current_user: CurrentUser, case_id: UUID, expansion_id: UUID, expected: str, target: str, values: dict | None = None) -> dict:
    case = _case(database, case_id)
    _authorize(database, current_user, case_id, case, True)
    expansion = database.search_expansion_by_id(str(case_id), str(expansion_id))
    if not expansion:
        raise HTTPException(status_code=404, detail="Search expansion not found.")
    if expansion.get("status") != expected:
        raise HTTPException(status_code=409, detail=f"Cannot change expansion from {expansion.get('status')} to {target}.")
    updated = database.update_search_expansion(str(case_id), str(expansion_id), {"status": target, **(values or {})})
    description = f"Search expansion {target.lower()} by authorized case manager."
    create_timeline_event(database, case_id, TimelineEventType.AI_PRIORITY_UPDATED, current_user.profile_id, description, {"expansion_id": str(expansion_id), "status": target})
    return updated


def approve(database: Database, current_user: CurrentUser, case_id: UUID, expansion_id: UUID) -> dict:
    return _transition(database, current_user, case_id, expansion_id, ExpansionStatus.RECOMMENDED.value, ExpansionStatus.APPROVED.value, {"approved_by": str(current_user.profile_id)})


def reject(database: Database, current_user: CurrentUser, case_id: UUID, expansion_id: UUID) -> dict:
    return _transition(database, current_user, case_id, expansion_id, ExpansionStatus.RECOMMENDED.value, ExpansionStatus.REJECTED.value)


def activate(database: Database, current_user: CurrentUser, case_id: UUID, expansion_id: UUID) -> dict:
    try:
        case = _case(database, case_id)
        updated = _transition(database, current_user, case_id, expansion_id, ExpansionStatus.APPROVED.value, ExpansionStatus.ACTIVE.value)
        database.update_case(str(case_id), {"current_radius_m": updated["new_radius_m"]})
        return updated
    except DatabaseError as error:
        raise _db_error(error) from error


def complete(database: Database, current_user: CurrentUser, case_id: UUID, expansion_id: UUID) -> dict:
    return _transition(database, current_user, case_id, expansion_id, ExpansionStatus.ACTIVE.value, ExpansionStatus.COMPLETED.value)