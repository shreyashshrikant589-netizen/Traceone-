"""Stable, side-effect-free wrappers for the TraceOne AI modules."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Iterable

from pydantic import BaseModel, Field

from ai.allocation.greedy import allocate_volunteers
from ai.anomaly.suspicious import suspicious_report_score
from ai.graph.builder import EvidenceGraph
from ai.graph.model import Evidence
from ai.nlp.extractor import process_witness_report
from ai.nlp.schemas import WitnessReportInput
from ai.anomaly.schemas import SuspiciousReportInput
from ai.priority.predict import predict_search_priority
from ai.priority.reprioritize import reprioritize_zone
from ai.police.summary import generate_police_summary
from ai.radius.expansion import recommend_search_radius as _recommend_search_radius
from ai.vision.match import compare_faces

SERVICE_VERSION = "ai-service-mvp-0.1"


class ServiceResult(BaseModel):
    """Consistent wrapper for successful and failed service calls."""

    success: bool
    status: str
    result: Any = None
    model_version: str = SERVICE_VERSION
    generated_at: Any = None
    error: str | None = None


def _version(value: Any, fallback: str) -> str:
    if isinstance(value, dict):
        return str(value.get("model_version", value.get("generator_version", fallback)))
    return str(getattr(value, "model_version", getattr(value, "generator_version", fallback)))


def _generated_at(value: Any) -> Any:
    if isinstance(value, dict):
        return value.get("generated_at")
    return getattr(value, "generated_at", None)


def _call(function: Any, *args: Any, fallback_version: str = SERVICE_VERSION, **kwargs: Any) -> ServiceResult:
    try:
        value = function(*args, **kwargs)
        return ServiceResult(success=True, status="OK", result=value, model_version=_version(value, fallback_version), generated_at=_generated_at(value) or datetime.now(timezone.utc))
    except (TypeError, ValueError, KeyError, AttributeError) as exc:
        return ServiceResult(success=False, status="VALIDATION_ERROR", error=f"{type(exc).__name__}: {exc}", generated_at=datetime.now(timezone.utc))


def get_search_priority(zone_input: Any) -> ServiceResult:
    return _call(predict_search_priority, zone_input, fallback_version="heuristic-mvp-v1")


def reprioritize_search(previous_zone: Any, new_evidence: Any) -> ServiceResult:
    return _call(reprioritize_zone, previous_zone, new_evidence, fallback_version="heuristic-mvp-v1")


def extract_witness_evidence(report: Any, zone_input: Any = None) -> ServiceResult:
    return _call(
        lambda: process_witness_report(report if isinstance(report, WitnessReportInput) else WitnessReportInput(**report), zone_input),
        fallback_version="nlp-mvp-0.1",
    )


def build_evidence_graph(evidence: Iterable[Any], links: Iterable[dict[str, str]] | None = None) -> ServiceResult:
    def build() -> dict[str, Any]:
        graph = EvidenceGraph()
        for item in evidence:
            graph.add_evidence(item if isinstance(item, Evidence) else Evidence(**item))
        for link in links or []:
            graph.link_evidence(link["source_id"], link["target_id"], link["relationship"])
        return graph.export()

    return _call(build, fallback_version="graph-mvp-0.1")


def check_possible_match(reference_image: Any, candidate_image: Any) -> ServiceResult:
    return _call(compare_faces, reference_image, candidate_image, fallback_version="vision-mvp-0.1")


def analyze_report_risk(report: Any, previous_reports: Iterable[Any] | None = None) -> ServiceResult:
    return _call(
        lambda: suspicious_report_score(report if isinstance(report, SuspiciousReportInput) else SuspiciousReportInput(**report), previous_reports),
        fallback_version="anomaly-mvp-0.1",
    )


def allocate_search_volunteers(volunteers: Iterable[Any], zones: Iterable[Any]) -> ServiceResult:
    return _call(allocate_volunteers, volunteers, zones, fallback_version="allocation-mvp-0.1")


def recommend_search_radius(search_input: Any) -> ServiceResult:
    return _call(_recommend_search_radius, search_input, fallback_version="radius-mvp-0.1")


def generate_police_case_summary(case_data: Any, evidence: Any = None, search_activity: Any = None) -> ServiceResult:
    return _call(generate_police_summary, case_data, evidence, search_activity, fallback_version="police-summary-mvp-0.1")


__all__ = [
    "ServiceResult",
    "allocate_search_volunteers",
    "analyze_report_risk",
    "build_evidence_graph",
    "check_possible_match",
    "extract_witness_evidence",
    "generate_police_case_summary",
    "get_search_priority",
    "recommend_search_radius",
    "reprioritize_search",
]
