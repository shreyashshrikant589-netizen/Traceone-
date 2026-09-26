from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status

from backend.schemas.common import UserRole
from backend.schemas.reports import EvidenceCreate, EvidenceReview, EvidenceStatus, ReportCreate, ReportReview, ReportStatus, WitnessCreate, WitnessReview, WitnessStatus
from backend.security.auth import CurrentUser, can_manage_case
from backend.services.database import Database, DatabaseError
from backend.services.zones import _active_member, _case
from backend.schemas.timeline import TimelineEventType
from backend.schemas.notifications import NotificationType
from backend.services.timeline import create_timeline_event
from backend.services.notifications import notify_case_managers


def _db_error(error: DatabaseError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database operation failed.")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _read_access(database: Database, current_user: CurrentUser, case_id: UUID, case: dict) -> bool:
    return can_manage_case(current_user, case) or _active_member(database, case_id, current_user.profile_id)


def _submit_access(database: Database, current_user: CurrentUser, case_id: UUID, case: dict) -> None:
    if not current_user.profile.get("is_verified", False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Verified active case membership is required.")
    if case.get("is_public") and case.get("status") == "PUBLIC_SEARCH":
        settings = database.case_settings_by_case_id(str(case_id))
        if not settings or not settings.get("allow_public_sightings"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Public sightings are disabled for this case.")
        if current_user.role == UserRole.VOLUNTEER:
            return
    if not _active_member(database, case_id, current_user.profile_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Verified active case membership is required.")


def _manager_access(current_user: CurrentUser, case: dict) -> None:
    if not can_manage_case(current_user, case):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only an authorized case manager can review this resource.")


def _report(database: Database, case_id: UUID, report_id: UUID) -> dict:
    report = database.report_by_id(str(case_id), str(report_id))
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
    return report


def _witness(database: Database, case_id: UUID, witness_id: UUID) -> dict:
    report = database.witness_report_by_id(str(case_id), str(witness_id))
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Witness report not found.")
    return report


def _evidence(database: Database, case_id: UUID, evidence_id: UUID) -> dict:
    evidence = database.evidence_by_id(str(case_id), str(evidence_id))
    if not evidence:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evidence not found.")
    return evidence


def _transition(current: str, target: str, allowed: dict[str, set[str]]) -> None:
    if target not in allowed.get(current, set()):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Cannot change status from {current} to {target}.")


def create_report(database: Database, current_user: CurrentUser, case_id: UUID, payload: ReportCreate) -> dict:
    try:
        case = _case(database, case_id)
        _submit_access(database, current_user, case_id, case)
        report = database.create_report({"case_id": str(case_id), "reporter_id": str(current_user.profile_id), "report_type": payload.report_type, "description": payload.description, "location": payload.location.model_dump() if payload.location else None, "status": ReportStatus.PENDING.value})
        create_timeline_event(database, case_id, TimelineEventType.SIGHTING_REPORTED, current_user.profile_id, "Report submitted.", {"report_id": str(report["id"]), "report_type": payload.report_type})
        return report
    except DatabaseError as error:
        raise _db_error(error) from error


def list_reports(database: Database, current_user: CurrentUser, case_id: UUID, report_status: ReportStatus | None, report_type: str | None) -> list[dict]:
    try:
        case = _case(database, case_id)
        if not _read_access(database, current_user, case_id, case):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to view reports.")
        return database.list_reports(str(case_id), report_status.value if report_status else None, report_type)
    except DatabaseError as error:
        raise _db_error(error) from error


def get_report(database: Database, current_user: CurrentUser, case_id: UUID, report_id: UUID) -> dict:
    try:
        case = _case(database, case_id)
        if not _read_access(database, current_user, case_id, case):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to view this report.")
        return _report(database, case_id, report_id)
    except DatabaseError as error:
        raise _db_error(error) from error


def review_report(database: Database, current_user: CurrentUser, case_id: UUID, report_id: UUID, payload: ReportReview) -> dict:
    try:
        case = _case(database, case_id)
        _manager_access(current_user, case)
        report = _report(database, case_id, report_id)
        _transition(report["status"], payload.status.value, {"PENDING": {"VERIFIED", "SUSPICIOUS", "REJECTED"}, "VERIFIED": {"RESOLVED"}})
        return database.update_report(str(report_id), {"status": payload.status.value, "reviewed_by": str(current_user.profile_id), "reviewed_at": _now()})
    except DatabaseError as error:
        raise _db_error(error) from error


def create_witness(database: Database, current_user: CurrentUser, case_id: UUID, payload: WitnessCreate) -> dict:
    try:
        case = _case(database, case_id)
        _submit_access(database, current_user, case_id, case)
        witness = database.create_witness_report({"case_id": str(case_id), "reported_by": str(current_user.profile_id), "description": payload.description, "reported_at": _now(), "observed_at": payload.observed_at.isoformat() if payload.observed_at else None, "location": payload.location.model_dump() if payload.location else None, "person_description": payload.person_description, "direction": payload.direction, "clothing": payload.clothing, "confidence": payload.confidence, "status": WitnessStatus.PENDING.value})
        evidence = database.create_evidence({"case_id": str(case_id), "submitted_by": str(current_user.profile_id), "evidence_type": "WITNESS", "description": payload.description, "location": payload.location.model_dump() if payload.location else None, "occurred_at": payload.observed_at.isoformat() if payload.observed_at else None, "confidence": payload.confidence, "source": "WITNESS_REPORT", "status": EvidenceStatus.PENDING.value})
        linked = database.update_witness_report(str(witness["id"]), {"evidence_id": evidence["id"]})
        create_timeline_event(database, case_id, TimelineEventType.SIGHTING_REPORTED, current_user.profile_id, "Witness sighting reported.", {"witness_report_id": str(witness["id"]), "evidence_id": str(evidence["id"])})
        notify_case_managers(database, case, case_id, NotificationType.NEW_SIGHTING, "New Sighting Reported", "A new witness sighting was reported.", {"witness_report_id": str(witness["id"]), "evidence_id": str(evidence["id"])})
        return linked
    except DatabaseError as error:
        raise _db_error(error) from error


def list_witness(database: Database, current_user: CurrentUser, case_id: UUID, report_status: WitnessStatus | None, reported_by: UUID | None) -> list[dict]:
    try:
        case = _case(database, case_id)
        if not _read_access(database, current_user, case_id, case):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to view witness reports.")
        return database.list_witness_reports(str(case_id), report_status.value if report_status else None, str(reported_by) if reported_by else None)
    except DatabaseError as error:
        raise _db_error(error) from error


def get_witness(database: Database, current_user: CurrentUser, case_id: UUID, witness_id: UUID) -> dict:
    try:
        case = _case(database, case_id)
        if not _read_access(database, current_user, case_id, case):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to view this witness report.")
        return _witness(database, case_id, witness_id)
    except DatabaseError as error:
        raise _db_error(error) from error


def review_witness(database: Database, current_user: CurrentUser, case_id: UUID, witness_id: UUID, payload: WitnessReview) -> dict:
    try:
        case = _case(database, case_id)
        _manager_access(current_user, case)
        witness = _witness(database, case_id, witness_id)
        _transition(witness["status"], payload.status.value, {"PENDING": {"VERIFIED", "SUSPICIOUS", "REJECTED"}})
        return database.update_witness_report(str(witness_id), {"status": payload.status.value, "updated_at": _now()})
    except DatabaseError as error:
        raise _db_error(error) from error


def create_evidence(database: Database, current_user: CurrentUser, case_id: UUID, payload: EvidenceCreate) -> dict:
    try:
        case = _case(database, case_id)
        _submit_access(database, current_user, case_id, case)
        if case.get("is_public") and case.get("status") == "PUBLIC_SEARCH" and payload.photo_url:
            settings = database.case_settings_by_case_id(str(case_id))
            if not settings or not settings.get("allow_photo_reports"):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Public photo reports are disabled for this case.")
        evidence = database.create_evidence({"case_id": str(case_id), "submitted_by": str(current_user.profile_id), "evidence_type": payload.evidence_type.value, "description": payload.description, "location": payload.location.model_dump() if payload.location else None, "occurred_at": payload.occurred_at.isoformat() if payload.occurred_at else None, "confidence": payload.confidence, "source": payload.source, "photo_url": payload.photo_url, "status": EvidenceStatus.PENDING.value})
        create_timeline_event(database, case_id, TimelineEventType.EVIDENCE_ADDED, current_user.profile_id, "Evidence submitted.", {"evidence_id": str(evidence["id"]), "evidence_type": payload.evidence_type.value})
        notify_case_managers(database, case, case_id, NotificationType.NEW_EVIDENCE, "New Evidence Submitted", "New evidence was submitted for the case.", {"evidence_id": str(evidence["id"]), "evidence_type": payload.evidence_type.value})
        return evidence
    except DatabaseError as error:
        raise _db_error(error) from error


def list_evidence(database: Database, current_user: CurrentUser, case_id: UUID, evidence_type: str | None, evidence_status: EvidenceStatus | None) -> list[dict]:
    try:
        case = _case(database, case_id)
        if not _read_access(database, current_user, case_id, case):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to view evidence.")
        return database.list_evidence(str(case_id), evidence_type, evidence_status.value if evidence_status else None)
    except DatabaseError as error:
        raise _db_error(error) from error


def get_evidence(database: Database, current_user: CurrentUser, case_id: UUID, evidence_id: UUID) -> dict:
    try:
        case = _case(database, case_id)
        if not _read_access(database, current_user, case_id, case):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to view evidence.")
        return _evidence(database, case_id, evidence_id)
    except DatabaseError as error:
        raise _db_error(error) from error


def review_evidence(database: Database, current_user: CurrentUser, case_id: UUID, evidence_id: UUID, payload: EvidenceReview) -> dict:
    try:
        case = _case(database, case_id)
        _manager_access(current_user, case)
        evidence = _evidence(database, case_id, evidence_id)
        _transition(evidence["status"], payload.status.value, {"PENDING": {"VERIFIED", "SUSPICIOUS", "REJECTED"}})
        return database.update_evidence(str(evidence_id), {"status": payload.status.value, "updated_at": _now()})
    except DatabaseError as error:
        raise _db_error(error) from error
