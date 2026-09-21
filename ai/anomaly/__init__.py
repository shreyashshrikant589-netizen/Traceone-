"""Public APIs for deterministic suspicious-report review signals."""

from ai.anomaly.consistency import check_report_consistency
from ai.anomaly.duplicate import calculate_text_similarity, detect_duplicate_report
from ai.anomaly.schemas import (
    ConsistencyResult,
    DuplicateReportResult,
    ReviewAction,
    RiskLevel,
    SuspiciousReportInput,
    SuspiciousReportResult,
)
from ai.anomaly.suspicious import suspicious_report_score, suspicious_result_to_evidence

__all__ = [
    "ConsistencyResult",
    "DuplicateReportResult",
    "ReviewAction",
    "RiskLevel",
    "SuspiciousReportInput",
    "SuspiciousReportResult",
    "calculate_text_similarity",
    "check_report_consistency",
    "detect_duplicate_report",
    "suspicious_report_score",
    "suspicious_result_to_evidence",
]
