"""Explainable suspiciousness scoring for human review only."""

from __future__ import annotations

from typing import Any, Iterable

from ai.anomaly.consistency import check_report_consistency
from ai.anomaly.duplicate import detect_duplicate_report
from ai.anomaly.schemas import ReviewAction, RiskLevel, SuspiciousReportInput, SuspiciousReportResult

WEIGHTS = {
    "DUPLICATE_TEXT": 20.0,
    "DUPLICATE_ATTACHMENT": 25.0,
    "CLOSE_CONTEXT_MATCH": 5.0,
    "INVALID_LATITUDE": 35.0,
    "INVALID_LONGITUDE": 35.0,
    "FUTURE_TIMESTAMP": 25.0,
    "MISSING_CONTEXT": 10.0,
    "RAPID_LOCATION_CHANGE": 20.0,
    "CONTRADICTORY_INFORMATION": 15.0,
    "REPEATED_FLAGGED_REPORTER": 30.0,
    "ELEVATED_FLAGGED_HISTORY": 10.0,
    "SUSPICIOUS_METADATA": 15.0,
}
LOW_RISK_MAX = 29.0
MEDIUM_RISK_MAX = 59.0


def _add_signal(score: float, flags: list[str], reasons: list[str], flag: str, reason: str) -> float:
    if flag not in flags:
        flags.append(flag)
        reasons.append(reason)
    return score + WEIGHTS.get(flag, 0.0)


def _risk_level(score: float) -> RiskLevel:
    if score <= LOW_RISK_MAX:
        return RiskLevel.LOW
    if score <= MEDIUM_RISK_MAX:
        return RiskLevel.MEDIUM
    return RiskLevel.HIGH


def suspicious_report_score(report: SuspiciousReportInput, previous_reports: Iterable[Any] | None = None) -> SuspiciousReportResult:
    """Calculate a suspiciousness/review-risk signal, never a fraud probability."""
    previous = list(previous_reports or [])
    duplicate = detect_duplicate_report(report, previous)
    consistency = check_report_consistency(report, previous)
    flags: list[str] = []
    reasons: list[str] = []
    score = 0.0

    reason_by_flag = dict(zip(duplicate.flags, duplicate.reasons))
    for flag in duplicate.flags:
        score = _add_signal(score, flags, reasons, flag, reason_by_flag[flag])
    reason_by_flag = dict(zip(consistency.flags, consistency.reasons))
    for flag in consistency.flags:
        score = _add_signal(score, flags, reasons, flag, reason_by_flag[flag])

    flagged_history = report.previous_flagged_report_count
    if flagged_history >= 2:
        score = _add_signal(score, flags, reasons, "REPEATED_FLAGGED_REPORTER", "Reporter has multiple previously flagged submissions; human review is required.")
    elif flagged_history == 1:
        score = _add_signal(score, flags, reasons, "ELEVATED_FLAGGED_HISTORY", "Reporter has a previously flagged submission; this is an elevated review signal.")

    metadata = report.metadata or {}
    if metadata.get("suspicious_metadata") or metadata.get("review_signals"):
        score = _add_signal(score, flags, reasons, "SUSPICIOUS_METADATA", "Report metadata contains an explicit review signal.")

    corroboration_count = report.corroborating_report_count
    if corroboration_count > 0:
        reduction = min(15.0, corroboration_count * 5.0)
        score -= reduction
        flags.append("CORROBORATED_REPORTS")
        reasons.append(f"{corroboration_count} corroborating report(s) reduce the review-risk signal; this does not verify the report.")

    score = round(max(0.0, min(100.0, score)), 2)
    risk_level = _risk_level(score)
    review_recommended = risk_level in (RiskLevel.MEDIUM, RiskLevel.HIGH)
    return SuspiciousReportResult(
        report_id=report.report_id,
        case_id=report.case_id,
        suspiciousness_score=score,
        risk_level=risk_level,
        flags=flags,
        reasons=reasons,
        review_recommended=review_recommended,
        action=ReviewAction.REVIEW if review_recommended else ReviewAction.NONE,
        generated_at=report.reported_at,
    )


def suspicious_result_to_evidence(report: SuspiciousReportInput, result: SuspiciousReportResult):
    """Explicitly convert a review result to suspicious evidence; never called automatically."""
    from ai.graph.model import Evidence, EvidenceStatus, EvidenceType

    location = "case-level report"
    if report.latitude is not None and report.longitude is not None:
        location = f"coordinates:{report.latitude},{report.longitude}"
    description = "Suspiciousness review signal: " + "; ".join(result.reasons or ["No specific review reason recorded."])
    return Evidence(
        evidence_id=f"anomaly-{report.report_id}",
        case_id=report.case_id,
        zone_id=None,
        type=EvidenceType.OBSERVATION,
        location=location,
        timestamp=report.reported_at.isoformat(),
        description=description,
        confidence=round(result.suspiciousness_score / 100.0, 4),
        source=report.source,
        status=EvidenceStatus.SUSPICIOUS if result.review_recommended else EvidenceStatus.RAW,
    )
