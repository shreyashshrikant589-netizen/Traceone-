"""Deterministic factual case summaries for human/admin review."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Iterable

from pydantic import BaseModel, Field

GENERATOR_VERSION = "police-summary-mvp-0.1"


class PoliceCaseSummary(BaseModel):
	case_id: str | None = None
	summary: str
	last_known_location: Any = None
	last_known_time: Any = None
	person_description: Any = None
	sightings: list[dict[str, Any]] = Field(default_factory=list)
	witness_reports: list[dict[str, Any]] = Field(default_factory=list)
	search_activity: Any = None
	current_search_area: Any = None
	relevant_evidence: list[dict[str, Any]] = Field(default_factory=list)
	timeline_events: list[dict[str, Any]] = Field(default_factory=list)
	unresolved_items: list[str] = Field(default_factory=list)
	generated_at: datetime
	generator_version: str = GENERATOR_VERSION


def _as_dict(value: Any) -> dict[str, Any]:
	if isinstance(value, dict):
		return value
	if hasattr(value, "model_dump"):
		return value.model_dump()
	if hasattr(value, "dict"):
		return value.dict()
	return {}


def _get(value: Any, *keys: str) -> Any:
	data = _as_dict(value)
	for key in keys:
		if data.get(key) is not None:
			return data[key]
	return None


def _evidence_list(evidence: Any) -> list[dict[str, Any]]:
	if evidence is None:
		return []
	if isinstance(evidence, dict):
		evidence = evidence.get("evidence", evidence.get("items", [evidence]))
	if not isinstance(evidence, Iterable) or isinstance(evidence, (str, bytes)):
		return []
	return [_as_dict(item) for item in evidence if _as_dict(item)]


def _search_data(search_activity: Any) -> Any:
	if search_activity is None:
		return None
	if isinstance(search_activity, dict):
		return search_activity
	return [_as_dict(item) for item in search_activity] if isinstance(search_activity, Iterable) and not isinstance(search_activity, (str, bytes)) else search_activity


def _factual_summary(case_data: Any, evidence: list[dict[str, Any]], search_activity: Any, unresolved: list[str]) -> str:
	parts: list[str] = []
	case_id = _get(case_data, "case_id", "id")
	location = _get(case_data, "last_known_location", "location")
	last_time = _get(case_data, "last_known_time", "last_seen_time")
	if case_id is not None:
		parts.append(f"Case {case_id}.")
	if location is not None:
		parts.append(f"Last known location: {location}.")
	if last_time is not None:
		parts.append(f"Last known time: {last_time}.")
	verified_count = sum(item.get("status") == "VERIFIED" for item in evidence)
	reported_count = sum(item.get("status") in {"RAW", "PENDING_REVIEW"} for item in evidence)
	if verified_count:
		parts.append(f"{verified_count} verified evidence item(s) are recorded.")
	if reported_count:
		parts.append(f"{reported_count} evidence item(s) remain reported or pending review.")
	if search_activity is not None:
		parts.append("Search activity provided for review.")
	if unresolved:
		parts.append("Unresolved information remains: " + "; ".join(unresolved) + ".")
	return " ".join(parts) or "No case facts were provided; human review is required."


def generate_police_summary(case_data: Any, evidence: Any = None, search_activity: Any = None) -> PoliceCaseSummary:
	"""Generate a factual, structured summary from supplied case information only."""
	case = _as_dict(case_data)
	evidence_items = _evidence_list(evidence)
	search = _search_data(search_activity)
	unresolved: list[str] = []
	location = _get(case, "last_known_location", "location")
	last_time = _get(case, "last_known_time", "last_seen_time")
	person = _get(case, "person_description", "missing_person", "description")
	if location is None:
		unresolved.append("last known location is not provided")
	if last_time is None:
		unresolved.append("last known time is not provided")
	if person is None:
		unresolved.append("person description is not provided")
	if not evidence_items:
		unresolved.append("no evidence items are provided")
	if search is None:
		unresolved.append("search activity is not provided")

	sightings = [item for item in evidence_items if item.get("type") in {"SIGHTING", "OBSERVATION"} and item.get("status") in {"VERIFIED", "RAW", "PENDING_REVIEW"}]
	witnesses = [item for item in evidence_items if item.get("type") == "WITNESS"]
	timeline = sorted([item for item in evidence_items if item.get("timestamp") is not None], key=lambda item: str(item.get("timestamp")))
	current_area = _get(search, "current_search_area", "recommended_area", "current_area")
	if current_area is None and isinstance(search, list) and search:
		current_area = _get(search[-1], "current_search_area", "recommended_area", "current_area")

	generated_at = _get(case, "generated_at") or datetime.now(timezone.utc)
	return PoliceCaseSummary(
		case_id=_get(case, "case_id", "id"),
		summary=_factual_summary(case_data, evidence_items, search, unresolved),
		last_known_location=location,
		last_known_time=last_time,
		person_description=person,
		sightings=sightings,
		witness_reports=witnesses,
		search_activity=search,
		current_search_area=current_area,
		relevant_evidence=evidence_items,
		timeline_events=timeline,
		unresolved_items=unresolved,
		generated_at=generated_at,
	)
