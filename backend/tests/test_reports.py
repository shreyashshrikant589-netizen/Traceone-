import unittest
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from fastapi.testclient import TestClient

from backend.main import app
from backend.schemas.common import UserRole
from backend.schemas.reports import EvidenceCreate, EvidenceReview, EvidenceStatus, EvidenceType, ReportCreate, ReportReview, ReportStatus, WitnessCreate, WitnessReview, WitnessStatus
from backend.schemas.sessions import PointGeometry
from backend.security.auth import CurrentUser
from backend.services import reports

PROFILE_ID = UUID("11111111-1111-1111-1111-111111111111")
OTHER_ID = UUID("66666666-6666-6666-6666-666666666666")
CASE_ID = UUID("33333333-3333-3333-3333-333333333333")
REPORT_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
WITNESS_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
EVIDENCE_ID = UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")


def current(role: UserRole = UserRole.VOLUNTEER, profile_id: UUID = PROFILE_ID, verified: bool = True) -> CurrentUser:
    return CurrentUser(UUID("22222222-2222-2222-2222-222222222222"), {"id": str(profile_id), "role": role, "is_active": True, "is_verified": verified})


def base_record(identifier: str, **values: object) -> dict:
    row = {"id": identifier, "case_id": str(CASE_ID), "status": "PENDING", "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()}
    row.update(values)
    return row


class FakeDatabase:
    def __init__(self) -> None:
        self.report = base_record(str(REPORT_ID), reporter_id=str(PROFILE_ID), report_type="SIGHTING", description="Seen near station", location=None, reviewed_by=None, reviewed_at=None)
        self.witness = base_record(str(WITNESS_ID), evidence_id=None, reported_by=str(PROFILE_ID), description="Witness saw person", reported_at=datetime.now(timezone.utc).isoformat(), observed_at=None, location=None, person_description=None, direction=None, clothing=None, confidence=0.8)
        self.evidence = base_record(str(EVIDENCE_ID), submitted_by=str(PROFILE_ID), evidence_type="WITNESS", description="Witness saw person", location=None, occurred_at=None, confidence=0.8, source="WITNESS_REPORT", photo_url=None)
        self.case = {"id": str(CASE_ID), "created_by": str(PROFILE_ID), "case_manager_id": str(PROFILE_ID), "is_public": False}

    def case_by_id(self, case_id: str) -> dict | None:
        return self.case if case_id == str(CASE_ID) else None

    def list_case_memberships_for_user(self, profile_id: str) -> list[dict]:
        return [{"case_id": str(CASE_ID), "user_id": profile_id, "status": "ACTIVE", "left_at": None}]

    def create_report(self, values: dict) -> dict:
        self.report.update(values)
        return self.report

    def list_reports(self, case_id: str, report_status: str | None = None, report_type: str | None = None) -> list[dict]:
        return [self.report]

    def report_by_id(self, case_id: str, report_id: str) -> dict | None:
        return self.report if case_id == str(CASE_ID) and report_id == str(REPORT_ID) else None

    def update_report(self, report_id: str, values: dict) -> dict:
        self.report.update(values)
        return self.report

    def create_witness_report(self, values: dict) -> dict:
        self.witness.update(values)
        return self.witness

    def list_witness_reports(self, case_id: str, report_status: str | None = None, reported_by: str | None = None) -> list[dict]:
        return [self.witness]

    def witness_report_by_id(self, case_id: str, witness_id: str) -> dict | None:
        return self.witness if case_id == str(CASE_ID) and witness_id == str(WITNESS_ID) else None

    def update_witness_report(self, witness_id: str, values: dict) -> dict:
        self.witness.update(values)
        return self.witness

    def create_evidence(self, values: dict) -> dict:
        self.evidence.update(values)
        return self.evidence

    def list_evidence(self, case_id: str, evidence_type: str | None = None, evidence_status: str | None = None) -> list[dict]:
        return [self.evidence]

    def evidence_by_id(self, case_id: str, evidence_id: str) -> dict | None:
        return self.evidence if case_id == str(CASE_ID) and evidence_id == str(EVIDENCE_ID) else None

    def update_evidence(self, evidence_id: str, values: dict) -> dict:
        self.evidence.update(values)
        return self.evidence


class ReportEvidenceTests(unittest.TestCase):
    def test_unauthenticated_create_is_401(self) -> None:
        response = TestClient(app).post(f"/api/v1/cases/{CASE_ID}/reports", json={"report_type": "SIGHTING"})
        self.assertEqual(response.status_code, 401)

    def test_member_report_derives_identity_and_pending_status(self) -> None:
        database = FakeDatabase()
        result = reports.create_report(database, current(), CASE_ID, ReportCreate(report_type="SIGHTING", description="Seen"))
        self.assertEqual(result["reporter_id"], str(PROFILE_ID))
        self.assertEqual(result["status"], "PENDING")

    def test_unverified_member_rejected_and_point_validation(self) -> None:
        with self.assertRaisesRegex(HTTPException, "Verified active"):
            reports.create_report(FakeDatabase(), current(verified=False), CASE_ID, ReportCreate(report_type="SIGHTING"))
        with self.assertRaises(ValueError):
            PointGeometry(type="Polygon", coordinates=[])

    def test_manager_reviews_report_and_invalid_transition_rejected(self) -> None:
        database = FakeDatabase()
        result = reports.review_report(database, current(UserRole.CASE_MANAGER), CASE_ID, REPORT_ID, ReportReview(status=ReportStatus.VERIFIED))
        self.assertEqual(result["status"], "VERIFIED")
        with self.assertRaisesRegex(HTTPException, "Cannot change"):
            reports.review_report(database, current(UserRole.CASE_MANAGER), CASE_ID, REPORT_ID, ReportReview(status=ReportStatus.REJECTED))

    def test_volunteer_cannot_review(self) -> None:
        with self.assertRaisesRegex(HTTPException, "Only an authorized"):
            reports.review_report(FakeDatabase(), current(profile_id=OTHER_ID), CASE_ID, REPORT_ID, ReportReview(status=ReportStatus.VERIFIED))

    def test_witness_creates_linked_evidence(self) -> None:
        database = FakeDatabase()
        result = reports.create_witness(database, current(), CASE_ID, WitnessCreate(description="Witness saw person", confidence=0.8))
        self.assertEqual(result["evidence_id"], str(EVIDENCE_ID))
        self.assertEqual(database.evidence["evidence_type"], "WITNESS")
        self.assertEqual(database.evidence["source"], "WITNESS_REPORT")

    def test_witness_review_and_confidence_validation(self) -> None:
        database = FakeDatabase()
        result = reports.review_witness(database, current(UserRole.CASE_MANAGER), CASE_ID, WITNESS_ID, WitnessReview(status=WitnessStatus.SUSPICIOUS))
        self.assertEqual(result["status"], "SUSPICIOUS")
        with self.assertRaises(ValueError):
            WitnessCreate(confidence=1.1)

    def test_evidence_creation_and_review(self) -> None:
        database = FakeDatabase()
        result = reports.create_evidence(database, current(), CASE_ID, EvidenceCreate(evidence_type=EvidenceType.OBSERVATION, confidence=0.5))
        self.assertEqual(result["status"], "PENDING")
        result = reports.review_evidence(database, current(UserRole.CASE_MANAGER), CASE_ID, EVIDENCE_ID, EvidenceReview(status=EvidenceStatus.REJECTED))
        self.assertEqual(result["status"], "REJECTED")

    def test_volunteer_cannot_review_evidence(self) -> None:
        with self.assertRaisesRegex(HTTPException, "Only an authorized"):
            reports.review_evidence(FakeDatabase(), current(profile_id=OTHER_ID), CASE_ID, EVIDENCE_ID, EvidenceReview(status=EvidenceStatus.VERIFIED))


if __name__ == "__main__":
    unittest.main()
