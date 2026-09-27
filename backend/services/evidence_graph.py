import math
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status

from backend.schemas.common import UserRole
from backend.schemas.timeline import TimelineEventType
from backend.security.auth import CurrentUser, can_manage_case
from backend.services.database import Database, DatabaseError
from backend.services.timeline import create_timeline_event

EVIDENCE_LINK_DISTANCE_M = 500.0
EVIDENCE_LINK_TIME_HOURS = 6.0
ACCEPTED_STATUSES = {"VERIFIED", "RESOLVED", "COMPLETED"}
NODE_TYPES = {"LAST_SEEN", "WITNESS", "OBSERVATION", "DIRECTION", "EXIT", "CROWD_FLOW", "SEARCH_RESULT", "SIGHTING"}


def _db_error(error: DatabaseError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database operation failed.")


def _clamp(value: float) -> float:
    return max(0.0, min(1.0, float(value)))


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
        raise HTTPException(status_code=403, detail="You are not authorized for this evidence graph.")


def _timestamp(row: dict, *keys: str) -> str | None:
    for key in keys:
        if row.get(key):
            return str(row[key])
    return None


def _parse_timestamp(value: Any) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00")).astimezone(timezone.utc)
    except ValueError:
        return None


def _point(value: Any) -> tuple[float, float] | None:
    if not value:
        return None
    if isinstance(value, dict):
        if "lat" in value and ("lng" in value or "lon" in value):
            return float(value["lat"]), float(value.get("lng", value.get("lon")))
        if "latitude" in value and "longitude" in value:
            return float(value["latitude"]), float(value["longitude"])
        if "coordinates" in value:
            return _point(value["coordinates"])
    if isinstance(value, (list, tuple)) and len(value) >= 2 and all(isinstance(item, (int, float)) for item in value[:2]):
        return float(value[1]), float(value[0])
    if isinstance(value, (list, tuple)):
        for item in value:
            point = _point(item)
            if point:
                return point
    return None


def _distance_m(first: Any, second: Any) -> float | None:
    left, right = _point(first), _point(second)
    if not left or not right:
        return None
    lat1, lon1 = map(math.radians, left)
    lat2, lon2 = map(math.radians, right)
    a = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    return 6371000.0 * 2 * math.asin(math.sqrt(a))


def _node_values(case_id: UUID, node_type: str, reference_id: str | None, source: dict) -> dict:
    confidence = _clamp(float(source.get("confidence") if source.get("confidence") is not None else 0.5))
    return {"case_id": str(case_id), "node_type": node_type, "reference_id": reference_id, "location": source.get("location"), "timestamp": source.get("timestamp"), "description": source.get("description"), "confidence": confidence}


def _source_key(node: dict) -> tuple[str, str | None]:
    return str(node.get("node_type")), str(node.get("reference_id")) if node.get("reference_id") is not None else None


def _add_node(database: Database, case_id: UUID, existing: dict[tuple[str, str | None], dict], node_type: str, reference_id: str | None, source: dict) -> dict:
    key = (node_type, reference_id)
    if key in existing:
        return existing[key]
    created = database.create_evidence_graph_node(_node_values(case_id, node_type, reference_id, source))
    existing[key] = created
    return created


def _usable(row: dict) -> bool:
    return row.get("status") in ACCEPTED_STATUSES or row.get("status") is None


def rebuild(database: Database, current_user: CurrentUser, case_id: UUID) -> dict:
    try:
        case = _case(database, case_id)
        _authorize(database, current_user, case_id, case, True)
        existing_nodes = {_source_key(row): row for row in database.list_evidence_graph_nodes(str(case_id))}
        existing_edges = database.list_evidence_graph_edges(str(case_id))
        evidence = [row for row in database.list_evidence(str(case_id)) if _usable(row)]
        witnesses = [row for row in database.list_witness_reports(str(case_id)) if _usable(row)]
        reports = [row for row in database.list_reports(str(case_id)) if _usable(row)]
        sessions = [row for row in database.list_sessions(str(case_id)) if row.get("status") == "COMPLETED"]
        nodes = []
        if case.get("last_seen_location") and case.get("last_seen_at"):
            nodes.append(_add_node(database, case_id, existing_nodes, "LAST_SEEN", None, {"location": case["last_seen_location"], "timestamp": case["last_seen_at"], "description": "Last-seen location recorded for the case.", "confidence": 0.7}))
        for row in witnesses:
            nodes.append(_add_node(database, case_id, existing_nodes, "WITNESS", str(row["id"]), {"location": row.get("location"), "timestamp": _timestamp(row, "observed_at", "reported_at"), "description": row.get("description") or "Verified witness report.", "confidence": row.get("confidence")}))
            if row.get("direction"):
                nodes.append(_add_node(database, case_id, existing_nodes, "DIRECTION", str(row["id"]), {"location": row.get("location"), "timestamp": _timestamp(row, "observed_at", "reported_at"), "description": f"Witness indicated movement toward {row['direction']}.", "confidence": row.get("confidence")}))
        for row in evidence:
            node_type = str(row.get("evidence_type", "")).upper()
            if node_type in NODE_TYPES:
                nodes.append(_add_node(database, case_id, existing_nodes, node_type, str(row["id"]), {"location": row.get("location"), "timestamp": _timestamp(row, "occurred_at", "created_at"), "description": row.get("description") or f"Verified {node_type.lower()} evidence.", "confidence": row.get("confidence")}))
        for row in reports:
            node_type = str(row.get("report_type", "OBSERVATION")).upper()
            if node_type not in NODE_TYPES:
                node_type = "OBSERVATION"
            nodes.append(_add_node(database, case_id, existing_nodes, node_type, str(row["id"]), {"location": row.get("location"), "timestamp": _timestamp(row, "created_at"), "description": row.get("description") or "Verified report.", "confidence": 0.6}))
        for row in sessions:
            nodes.append(_add_node(database, case_id, existing_nodes, "SEARCH_RESULT", str(row["id"]), {"location": row.get("end_location") or row.get("start_location"), "timestamp": _timestamp(row, "ended_at", "started_at"), "description": "Zone search completed with no confirmed sighting.", "confidence": 0.7}))
        edges = list(existing_edges)
        edge_keys = {(str(row.get("source_node_id")), str(row.get("target_node_id")), str(row.get("relationship_type"))) for row in edges}
        def add_edge(source: dict, target: dict, relationship: str, strength: float) -> None:
            key = (str(source["id"]), str(target["id"]), relationship)
            if key in edge_keys or str(source["id"]) == str(target["id"]):
                return
            source_confidence = _clamp(float(source.get("confidence") if source.get("confidence") is not None else 0.5))
            edge = database.create_evidence_graph_edge({"case_id": str(case_id), "source_node_id": str(source["id"]), "target_node_id": str(target["id"]), "relationship_type": relationship, "weight": _clamp(strength), "confidence": _clamp(source_confidence * strength)})
            edges.append(edge)
            edge_keys.add(key)
        for source in nodes:
            for target in nodes:
                if source is target:
                    continue
                if source.get("node_type") == "LAST_SEEN" and target.get("node_type") in {"WITNESS", "SIGHTING", "OBSERVATION"}:
                    relationship = "SUPPORTED_BY"
                elif source.get("node_type") == "WITNESS" and target.get("node_type") == "DIRECTION":
                    relationship = "INDICATED_DIRECTION"
                else:
                    relationship = "RELATED_TO"
                source_time = _parse_timestamp(source.get("timestamp"))
                target_time = _parse_timestamp(target.get("timestamp"))
                distance = _distance_m(source.get("location"), target.get("location"))
                if relationship == "INDICATED_DIRECTION":
                    add_edge(source, target, relationship, 0.8)
                elif source_time and target_time and source_time <= target_time and (target_time - source_time).total_seconds() <= EVIDENCE_LINK_TIME_HOURS * 3600 and distance is not None and distance <= EVIDENCE_LINK_DISTANCE_M:
                    strength = _clamp((1 - distance / EVIDENCE_LINK_DISTANCE_M) * 0.5 + 0.5 * (1 - (target_time - source_time).total_seconds() / (EVIDENCE_LINK_TIME_HOURS * 3600)))
                    add_edge(source, target, relationship, strength)
        create_timeline_event(database, case_id, TimelineEventType.AI_PRIORITY_UPDATED, current_user.profile_id, "Evidence graph rebuilt for explainable search intelligence.", {"nodes_created_or_reused": len(nodes), "edges_created_or_reused": len(edges)})
        return {"nodes": list(existing_nodes.values()), "edges": edges}
    except DatabaseError as error:
        raise _db_error(error) from error


def graph(database: Database, current_user: CurrentUser, case_id: UUID) -> dict:
    try:
        case = _case(database, case_id)
        _authorize(database, current_user, case_id, case, False)
        return {"nodes": database.list_evidence_graph_nodes(str(case_id)), "edges": database.list_evidence_graph_edges(str(case_id))}
    except DatabaseError as error:
        raise _db_error(error) from error


def node(database: Database, current_user: CurrentUser, case_id: UUID, node_id: UUID) -> dict:
    result = graph(database, current_user, case_id)
    found = next((item for item in result["nodes"] if str(item.get("id")) == str(node_id)), None)
    if not found:
        raise HTTPException(status_code=404, detail="Evidence graph node not found.")
    connected = [edge for edge in result["edges"] if str(edge.get("source_node_id")) == str(node_id) or str(edge.get("target_node_id")) == str(node_id)]
    return {**found, "connected_edges": connected}


def explanation(database: Database, current_user: CurrentUser, case_id: UUID, zone_id: UUID) -> dict:
    try:
        case = _case(database, case_id)
        _authorize(database, current_user, case_id, case, False)
        zone = database.zone_by_id(str(case_id), str(zone_id))
        if not zone:
            raise HTTPException(status_code=404, detail="Zone not found.")
        priority = database.latest_ai_search_priority(str(case_id), str(zone_id))
        if not priority:
            raise HTTPException(status_code=404, detail="AI priority not found.")
        nodes = database.list_evidence_graph_nodes(str(case_id))
        relevant = [item for item in nodes if item.get("node_type") in {"LAST_SEEN", "WITNESS", "DIRECTION", "EXIT", "CROWD_FLOW", "SIGHTING", "OBSERVATION"}]
        supporting = [{"node_type": item["node_type"], "description": item.get("description"), "confidence": _clamp(float(item.get("confidence") or 0.5))} for item in relevant[:10]]
        phrases = []
        if float(priority.get("distance_score") or 0) > 0.65 and any(item.get("node_type") == "LAST_SEEN" for item in relevant):
            phrases.append("close to the last-seen location")
        if float(priority.get("witness_score") or 0) > 0.5 and any(item.get("node_type") == "WITNESS" for item in relevant):
            phrases.append("supported by a witness report")
        if float(priority.get("direction_score") or 0) > 0.5 and any(item.get("node_type") == "DIRECTION" for item in relevant):
            phrases.append("indicates movement toward a reported direction")
        if float(priority.get("coverage_score") or 0) >= 0.8:
            phrases.append("has limited verified search coverage")
        explanation_text = priority.get("explanation") or "Priority is based on available evidence and search coverage."
        if phrases:
            explanation_text = "Priority supported by " + ", ".join(phrases) + "."
        return {"zone_id": str(zone_id), "priority_score": priority["priority_score"], "confidence": priority["confidence"], "model_version": priority["model_version"], "explanation": explanation_text, "supporting_evidence": supporting}
    except DatabaseError as error:
        raise _db_error(error) from error