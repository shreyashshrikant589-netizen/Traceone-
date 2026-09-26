import math
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status

from backend.schemas.common import UserRole
from backend.schemas.notifications import NotificationType
from backend.schemas.timeline import TimelineEventType
from backend.security.auth import CurrentUser, can_manage_case
from backend.services.database import Database, DatabaseError
from backend.services.notifications import create_notification, notify_case_managers
from backend.services.timeline import create_timeline_event

MODEL_VERSION = "traceone-baseline-v1"
HIGH_PRIORITY_THRESHOLD = 75.0
WEIGHTS = {"distance": 0.20, "time": 0.15, "witness": 0.20, "direction": 0.10, "exit": 0.10, "crowd": 0.10, "coverage": 0.10, "destination": 0.05}


def _db_error(error: DatabaseError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database operation failed.")


def _clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, float(value)))


def _case(database: Database, case_id: UUID) -> dict:
    case = database.case_by_id(str(case_id))
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")
    return case


def _active_member(database: Database, case_id: UUID, profile_id: UUID) -> bool:
    return any(str(row.get("case_id")) == str(case_id) and str(row.get("user_id")) == str(profile_id) and row.get("status") == "ACTIVE" and row.get("left_at") is None for row in database.list_case_memberships_for_user(str(profile_id)))


def _view_access(database: Database, current_user: CurrentUser, case_id: UUID, case: dict) -> bool:
    return current_user.role == UserRole.SUPER_ADMIN or can_manage_case(current_user, case) or _active_member(database, case_id, current_user.profile_id)


def _authorize(database: Database, current_user: CurrentUser, case_id: UUID, case: dict, manage: bool) -> None:
    if not current_user.profile.get("is_active", False) or not current_user.profile.get("is_verified", False):
        raise HTTPException(status_code=403, detail="Active verified account required.")
    allowed = can_manage_case(current_user, case) if manage else _view_access(database, current_user, case_id, case)
    if not allowed:
        raise HTTPException(status_code=403, detail="You are not authorized to view or update search priorities.")


def _coordinates(value: Any) -> list[tuple[float, float]]:
    if isinstance(value, dict):
        if "coordinates" in value:
            return _coordinates(value["coordinates"])
        if "lat" in value and ("lng" in value or "lon" in value):
            return [(float(value["lat"]), float(value.get("lng", value.get("lon"))))]
        if "latitude" in value and "longitude" in value:
            return [(float(value["latitude"]), float(value["longitude"]))]
    if isinstance(value, (list, tuple)):
        if len(value) >= 2 and all(isinstance(item, (int, float)) for item in value[:2]):
            return [(float(value[1]), float(value[0]))]
        points = []
        for item in value:
            points.extend(_coordinates(item))
        return points
    return []


def _centroid(value: Any) -> tuple[float, float] | None:
    points = _coordinates(value)
    if not points:
        return None
    return sum(point[0] for point in points) / len(points), sum(point[1] for point in points) / len(points)


def _distance_score(case: dict, zone: dict) -> float:
    origin = _centroid(case.get("last_seen_location"))
    target = _centroid(zone.get("geometry"))
    if not origin or not target:
        return 0.5
    distance = math.hypot(origin[0] - target[0], origin[1] - target[1])
    return _clamp(1.0 / (1.0 + distance * 100.0))


def _timestamp(row: dict) -> datetime | None:
    for key in ("observed_at", "occurred_at", "reported_at", "created_at", "started_at", "ended_at"):
        value = row.get(key)
        if value:
            try:
                return datetime.fromisoformat(str(value).replace("Z", "+00:00")).astimezone(timezone.utc)
            except ValueError:
                continue
    return None


def _recency_score(rows: list[dict], case: dict) -> float:
    timestamps = [_timestamp(row) for row in rows]
    timestamps = [value for value in timestamps if value]
    last_seen = _timestamp({"created_at": case.get("last_seen_at")})
    if last_seen:
        timestamps.append(last_seen)
    if not timestamps:
        return 0.5
    age_hours = max(0.0, (datetime.now(timezone.utc) - max(timestamps)).total_seconds() / 3600)
    return _clamp(math.exp(-age_hours / 72.0))


def _zone_relevance(row: dict, zone: dict) -> bool:
    zone_id = str(zone.get("id"))
    return str(row.get("zone_id")) == zone_id or str(row.get("assigned_zone_id")) == zone_id


def _score_zone(case: dict, zone: dict, evidence: list[dict], witnesses: list[dict], reports: list[dict], sessions: list[dict]) -> dict:
    relevant_witnesses = [row for row in witnesses if _zone_relevance(row, zone)]
    relevant_evidence = [row for row in evidence if _zone_relevance(row, zone)]
    relevant_reports = [row for row in reports if _zone_relevance(row, zone)]
    relevant_sessions = [row for row in sessions if str(row.get("zone_id")) == str(zone.get("id"))]
    usable_witnesses = [row for row in relevant_witnesses if row.get("status") not in {"REJECTED", "SUSPICIOUS"}]
    usable_evidence = [row for row in relevant_evidence if row.get("status") not in {"REJECTED", "SUSPICIOUS"}]
    usable_reports = [row for row in relevant_reports if row.get("status") not in {"REJECTED", "SUSPICIOUS"}]
    witness_score = _clamp(sum(float(row.get("confidence") or 0.5) for row in usable_witnesses) / max(1, len(usable_witnesses))) if usable_witnesses else 0.5
    coverage_score = {"UNSEARCHED": 1.0, "ASSIGNED": 0.8, "IN_PROGRESS": 0.55, "SEARCHED": 0.15}.get(str(zone.get("status")), 0.5)
    if any(row.get("status") == "COMPLETED" for row in relevant_sessions):
        coverage_score = min(coverage_score, 0.15)
    elif any(row.get("status") in {"ACTIVE", "PAUSED"} for row in relevant_sessions):
        coverage_score = min(coverage_score, 0.55)
    time_score = _recency_score(usable_evidence + usable_witnesses + usable_reports, case)
    direction_score = 0.5 if not any(row.get("direction") for row in usable_witnesses) else 0.75
    destination_score = 0.75 if case.get("known_destination") and case.get("known_destination", "").lower() in f"{zone.get('name', '')} {zone.get('description', '')}".lower() else 0.5
    features = {"distance": _distance_score(case, zone), "time": time_score, "witness": witness_score, "direction": direction_score, "exit": 0.5, "crowd": 0.5, "coverage": coverage_score, "destination": destination_score}
    score = _clamp(sum(features[name] * weight for name, weight in WEIGHTS.items()) * 100.0, 0.0, 100.0)
    evidence_count = len(usable_evidence) + len(usable_witnesses) + len(usable_reports)
    confidence = _clamp(0.25 + min(0.65, evidence_count * 0.15) - (0.15 if len(relevant_witnesses) > len(usable_witnesses) else 0.0))
    reasons = []
    if features["distance"] > 0.65:
        reasons.append("close to the last-seen location")
    if usable_witnesses:
        reasons.append("recent relevant witness evidence")
    if coverage_score >= 0.8:
        reasons.append("limited verified search coverage")
    if destination_score > 0.5:
        reasons.append("near the known destination path")
    explanation = f"{'High' if score >= HIGH_PRIORITY_THRESHOLD else 'Medium' if score >= 50 else 'Low'} priority based on " + (", ".join(reasons) if reasons else "available baseline signals") + "."
    return {"priority_score": round(score, 4), "confidence": round(confidence, 4), "distance_score": round(features["distance"], 4), "time_score": round(features["time"], 4), "crowd_score": round(features["crowd"], 4), "exit_score": round(features["exit"], 4), "witness_score": round(features["witness"], 4), "coverage_score": round(features["coverage"], 4), "direction_score": round(features["direction"], 4), "destination_score": round(features["destination"], 4), "explanation": explanation}


def _response(row: dict) -> dict:
    return row


def recalculate(database: Database, current_user: CurrentUser, case_id: UUID) -> list[dict]:
    try:
        case = _case(database, case_id)
        _authorize(database, current_user, case_id, case, True)
        zones = database.list_zones(str(case_id))
        if not zones:
            raise HTTPException(status_code=400, detail="No search zones exist for this case.")
        evidence = database.list_evidence(str(case_id))
        witnesses = database.list_witness_reports(str(case_id))
        reports = database.list_reports(str(case_id))
        sessions = database.list_sessions(str(case_id))
        calculated = [{"zone": zone, "features": _score_zone(case, zone, evidence, witnesses, reports, sessions)} for zone in zones]
        calculated.sort(key=lambda item: (-item["features"]["priority_score"], str(item["zone"].get("id"))))
        results = []
        for rank, item in enumerate(calculated, 1):
            zone = item["zone"]
            features = item["features"]
            values = {"case_id": str(case_id), "zone_id": str(zone["id"]), "model_version": MODEL_VERSION, "rank": rank, **features}
            stored = database.create_ai_search_priority(values)
            database.update_zone(str(case_id), str(zone["id"]), {"priority_score": features["priority_score"], "priority_rank": rank})
            results.append(_response(stored))
            was_high = float(zone.get("priority_score") or 0) >= HIGH_PRIORITY_THRESHOLD
            if features["priority_score"] >= HIGH_PRIORITY_THRESHOLD and not was_high:
                notify_case_managers(database, case, case_id, NotificationType.HIGH_PRIORITY_ZONE, "High Priority Search Zone", f"Zone {zone.get('name', '')} has a high TraceOne search priority recommendation.", {"zone_id": str(zone["id"]), "priority_score": features["priority_score"]})
        create_timeline_event(database, case_id, TimelineEventType.AI_PRIORITY_UPDATED, current_user.profile_id, "Search priorities recalculated using TraceOne baseline intelligence.", {"model_version": MODEL_VERSION, "zones_scored": len(results)})
        return results
    except DatabaseError as error:
        raise _db_error(error) from error


def list_priorities(database: Database, current_user: CurrentUser, case_id: UUID) -> list[dict]:
    try:
        case = _case(database, case_id)
        _authorize(database, current_user, case_id, case, False)
        return [_response(row) for row in database.list_ai_search_priorities(str(case_id))]
    except DatabaseError as error:
        raise _db_error(error) from error


def zone_priority(database: Database, current_user: CurrentUser, case_id: UUID, zone_id: UUID) -> dict:
    try:
        case = _case(database, case_id)
        _authorize(database, current_user, case_id, case, False)
        zone = database.zone_by_id(str(case_id), str(zone_id))
        if not zone:
            raise HTTPException(status_code=404, detail="Zone not found.")
        priority = database.latest_ai_search_priority(str(case_id), str(zone_id))
        if not priority:
            raise HTTPException(status_code=404, detail="AI priority not found.")
        return _response(priority)
    except DatabaseError as error:
        raise _db_error(error) from error