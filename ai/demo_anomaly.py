"""Synthetic suspicious-report review demonstration."""

from __future__ import annotations

import sys
from datetime import datetime
from pathlib import Path

if __package__ in (None, ""):
    repo_root = Path(__file__).resolve().parent.parent
    if str(repo_root) not in sys.path:
        sys.path.insert(0, str(repo_root))

from ai.anomaly import SuspiciousReportInput, suspicious_report_score


def show_example(label: str, report: SuspiciousReportInput, previous_reports=None) -> None:
    result = suspicious_report_score(report, previous_reports)
    print(label)
    print(f"- Report ID: {result.report_id}")
    print(f"- Suspiciousness score: {result.suspiciousness_score:.1f}")
    print(f"- Risk level: {result.risk_level.value}")
    print(f"- Flags: {result.flags or ['NONE']}")
    print(f"- Reasons: {result.reasons or ['No specific suspiciousness signal detected.']}")
    print(f"- Review recommended: {result.review_recommended}")
    print(f"- Action: {result.action.value}")
    print()


def main() -> None:
    print("TraceOne Suspicious / Fake Report Detection Demo")
    print("DEMO ONLY - synthetic data; suspiciousness is a review signal, not proof of fraud.\n")

    normal = SuspiciousReportInput(
        report_id="demo-normal",
        case_id="demo-case",
        reporter_id="reporter-a",
        text="I saw a child near the north gate at 10 AM.",
        source="synthetic-witness",
        reported_at=datetime(2026, 9, 20, 10, 0),
        evidence_ids=["synthetic-evidence-1"],
        corroborating_report_count=2,
    )
    show_example("Example 1 - normal report with supporting evidence", normal)

    previous = SuspiciousReportInput(
        report_id="demo-old",
        case_id="demo-case",
        reporter_id="reporter-b",
        text="A person was seen near the station carrying a blue bag.",
        source="synthetic-witness",
        reported_at=datetime(2026, 9, 20, 9, 30),
        attachment_hashes=["synthetic-hash-1"],
    )
    duplicate = SuspiciousReportInput(
        report_id="demo-duplicate",
        case_id="demo-case",
        reporter_id="reporter-b",
        text=previous.text,
        source="synthetic-witness",
        reported_at=datetime(2026, 9, 20, 9, 35),
        attachment_hashes=["synthetic-hash-1"],
    )
    show_example("Example 2 - duplicate text and attachment", duplicate, [previous])

    inconsistent = SuspiciousReportInput(
        report_id="demo-inconsistent",
        case_id="demo-case",
        reporter_id="reporter-c",
        text="A synthetic report with inconsistent coordinates.",
        source="synthetic-form",
        latitude=91.0,
        longitude=181.0,
        reported_at=datetime(2030, 1, 1),
    )
    show_example("Example 3 - invalid coordinates and future timestamp", inconsistent)


if __name__ == "__main__":
    main()
