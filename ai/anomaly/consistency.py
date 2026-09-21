"""Conservative consistency checks for suspicious-report review."""

from __future__ import annotations

from datetime import datetime, timezone
from math import asin, cos, radians, sin, sqrt
from typing import Any, Iterable

from ai.anomaly.schemas import ConsistencyResult, SuspiciousReportInput

RAPID_TRAVEL_DISTANCE_KM = 10.0
RAPID_TRAVEL_MINUTES = 10.0


def _value(report: Any, name: str, default: Any = None) -> Any:
    if isinstance(report, dict):
        return report.get(name, default)
    return getattr(report, name, default)


def _coordinates_valid(latitude: Any, longitude: Any) -> tuple[bool, str | None]:
    if latitude is None and longitude is None:
        return True, None
    if latitude is None or not -90 <= latitude <= 90:
        return False, "INVALID_LATITUDE"
    if longitude is None or not -180 <= longitude <= 180:
        return False, "INVALID_LONGITUDE"
    return True, None


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _distance_km(latitude_a: float, longitude_a: float, latitude_b: float, longitude_b: float) -> float:
    earth_radius_km = 6371.0
    delta_latitude = radians(latitude_b - latitude_a)
    delta_longitude = radians(longitude_b - longitude_a)
    value = sin(delta_latitude / 2) ** 2 + cos(radians(latitude_a)) * cos(radians(latitude_b)) * sin(delta_longitude / 2) ** 2
    return earth_radius_km * 2 * asin(sqrt(value))


def check_report_consistency(report: SuspiciousReportInput, previous_reports: Iterable[Any] | None = None) -> ConsistencyResult:
    """Return only evidence-backed consistency flags; missing data is not treated as suspicious."""
    flags: list[str] = []
    reasons: list[str] = []
    valid_coordinates, coordinate_flag = _coordinates_valid(_value(report, "latitude"), _value(report, "longitude"))
    if not valid_coordinates and coordinate_flag:
        flags.append(coordinate_flag)
        reasons.append("Supplied coordinates fall outside valid latitude/longitude ranges or are incomplete.")

    reported_at = _value(report, "reported_at")
    if isinstance(reported_at, datetime) and _as_utc(reported_at) > datetime.now(timezone.utc):
        flags.append("FUTURE_TIMESTAMP")
        reasons.append("Reported timestamp is in the future.")

    if not str(_value(report, "text", "")).strip() or not str(_value(report, "source", "")).strip():
        flags.append("MISSING_CONTEXT")
        reasons.append("Required report text or source context is missing.")

    metadata = _value(report, "metadata", {}) or {}
    if metadata.get("contradictory_information") or metadata.get("contradictions"):
        flags.append("CONTRADICTORY_INFORMATION")
        reasons.append("Report metadata explicitly identifies contradictory information for review.")

    latitude = _value(report, "latitude")
    longitude = _value(report, "longitude")
    if valid_coordinates and reported_at and latitude is not None and longitude is not None:
        for previous in previous_reports or []:
            previous_latitude = _value(previous, "latitude")
            previous_longitude = _value(previous, "longitude")
            previous_time = _value(previous, "reported_at")
            if None in (previous_latitude, previous_longitude) or not isinstance(previous_time, datetime):
                continue
            previous_valid, _ = _coordinates_valid(previous_latitude, previous_longitude)
            if not previous_valid or not isinstance(reported_at, datetime):
                continue
            minutes = abs((_as_utc(reported_at) - _as_utc(previous_time)).total_seconds()) / 60
            distance = _distance_km(latitude, longitude, previous_latitude, previous_longitude)
            if minutes <= RAPID_TRAVEL_MINUTES and distance > RAPID_TRAVEL_DISTANCE_KM:
                flags.append("RAPID_LOCATION_CHANGE")
                reasons.append("Related reports show a large location change in an unusually short interval.")
                break

    return ConsistencyResult(consistency_ok=not flags, flags=flags, reasons=reasons)
