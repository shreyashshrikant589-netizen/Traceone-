"""Deterministic duplicate-report detection helpers."""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any, Iterable

from ai.anomaly.schemas import DuplicateReportResult, SuspiciousReportInput

TEXT_DUPLICATE_THRESHOLD = 0.8
TEXT_CONTEXT_THRESHOLD = 0.5
LOCATION_TOLERANCE_DEGREES = 0.01
TIME_TOLERANCE_SECONDS = 30 * 60


def _value(report: Any, name: str, default: Any = None) -> Any:
    if isinstance(report, dict):
        return report.get(name, default)
    return getattr(report, name, default)


def _tokens(text: str) -> set[str]:
    return set(re.findall(r"\w+", str(text).lower(), flags=re.UNICODE))


def calculate_text_similarity(text_a: str, text_b: str) -> float:
    """Return token Jaccard similarity for two report texts."""
    tokens_a = _tokens(text_a)
    tokens_b = _tokens(text_b)
    if not tokens_a or not tokens_b:
        return 0.0
    return round(len(tokens_a & tokens_b) / len(tokens_a | tokens_b), 6)


def _same_location(report: Any, previous: Any) -> bool:
    latitude_a, longitude_a = _value(report, "latitude"), _value(report, "longitude")
    latitude_b, longitude_b = _value(previous, "latitude"), _value(previous, "longitude")
    if None in (latitude_a, longitude_a, latitude_b, longitude_b):
        return False
    return abs(latitude_a - latitude_b) <= LOCATION_TOLERANCE_DEGREES and abs(longitude_a - longitude_b) <= LOCATION_TOLERANCE_DEGREES


def _close_timestamp(report: Any, previous: Any) -> bool:
    timestamp_a, timestamp_b = _value(report, "reported_at"), _value(previous, "reported_at")
    if not isinstance(timestamp_a, datetime) or not isinstance(timestamp_b, datetime):
        return False
    return abs((timestamp_a - timestamp_b).total_seconds()) <= TIME_TOLERANCE_SECONDS


def detect_duplicate_report(report: SuspiciousReportInput, previous_reports: Iterable[Any] | None = None) -> DuplicateReportResult:
    """Find potentially repeated reports without deciding that any report is false."""
    matched_ids: list[str] = []
    flags: list[str] = []
    reasons: list[str] = []
    highest_similarity = 0.0
    current_hashes = set(_value(report, "attachment_hashes", []) or [])

    for previous in previous_reports or []:
        previous_id = _value(previous, "report_id")
        if not previous_id or previous_id == _value(report, "report_id"):
            continue
        text_similarity = calculate_text_similarity(_value(report, "text", ""), _value(previous, "text", ""))
        highest_similarity = max(highest_similarity, text_similarity)
        previous_hashes = set(_value(previous, "attachment_hashes", []) or [])
        shared_hashes = current_hashes & previous_hashes
        same_location = _same_location(report, previous)
        close_timestamp = _close_timestamp(report, previous)
        text_duplicate = text_similarity >= TEXT_DUPLICATE_THRESHOLD
        contextual_duplicate = text_similarity >= TEXT_CONTEXT_THRESHOLD and same_location and close_timestamp
        attachment_duplicate = bool(shared_hashes)

        if text_duplicate or contextual_duplicate or attachment_duplicate:
            matched_ids.append(str(previous_id))
            if text_duplicate or contextual_duplicate:
                if "DUPLICATE_TEXT" not in flags:
                    flags.append("DUPLICATE_TEXT")
                    reasons.append("Report text substantially overlaps a previous report.")
            if attachment_duplicate and "DUPLICATE_ATTACHMENT" not in flags:
                flags.append("DUPLICATE_ATTACHMENT")
                reasons.append("Attachment hash matches a previous report.")
            if same_location and close_timestamp and "CLOSE_CONTEXT_MATCH" not in flags:
                flags.append("CLOSE_CONTEXT_MATCH")
                reasons.append("The report has similar location and timing to a matched report.")

    return DuplicateReportResult(
        duplicate_detected=bool(matched_ids),
        similarity_score=round(highest_similarity, 4),
        matched_report_ids=matched_ids,
        flags=flags,
        reasons=reasons,
    )
