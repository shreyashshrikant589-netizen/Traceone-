from uuid import UUID

from fastapi import APIRouter, Depends

from backend.dependencies import get_database
from backend.schemas.reports import EvidenceCreate, EvidenceResponse, EvidenceReview, EvidenceStatus, ReportCreate, ReportResponse, ReportReview, ReportStatus, WitnessCreate, WitnessResponse, WitnessReview, WitnessStatus
from backend.security.auth import CurrentUser, require_active_user, require_verified_user
from backend.services import reports as report_service
from backend.services.database import Database

router = APIRouter(prefix="/cases/{case_id}", tags=["reports-evidence"])


@router.post("/reports", response_model=ReportResponse, status_code=201)
def create_report(case_id: UUID, payload: ReportCreate, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> ReportResponse:
    return ReportResponse.model_validate(report_service.create_report(database, current_user, case_id, payload))


@router.get("/reports", response_model=list[ReportResponse])
def list_reports(case_id: UUID, report_status: ReportStatus | None = None, report_type: str | None = None, current_user: CurrentUser = Depends(require_active_user), database: Database = Depends(get_database)) -> list[ReportResponse]:
    return [ReportResponse.model_validate(row) for row in report_service.list_reports(database, current_user, case_id, report_status, report_type)]


@router.get("/reports/{report_id}", response_model=ReportResponse)
def get_report(case_id: UUID, report_id: UUID, current_user: CurrentUser = Depends(require_active_user), database: Database = Depends(get_database)) -> ReportResponse:
    return ReportResponse.model_validate(report_service.get_report(database, current_user, case_id, report_id))


@router.patch("/reports/{report_id}/review", response_model=ReportResponse)
def review_report(case_id: UUID, report_id: UUID, payload: ReportReview, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> ReportResponse:
    return ReportResponse.model_validate(report_service.review_report(database, current_user, case_id, report_id, payload))


@router.post("/witness-reports", response_model=WitnessResponse, status_code=201)
def create_witness(case_id: UUID, payload: WitnessCreate, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> WitnessResponse:
    return WitnessResponse.model_validate(report_service.create_witness(database, current_user, case_id, payload))


@router.get("/witness-reports", response_model=list[WitnessResponse])
def list_witness(case_id: UUID, report_status: WitnessStatus | None = None, reported_by: UUID | None = None, current_user: CurrentUser = Depends(require_active_user), database: Database = Depends(get_database)) -> list[WitnessResponse]:
    return [WitnessResponse.model_validate(row) for row in report_service.list_witness(database, current_user, case_id, report_status, reported_by)]


@router.get("/witness-reports/{witness_id}", response_model=WitnessResponse)
def get_witness(case_id: UUID, witness_id: UUID, current_user: CurrentUser = Depends(require_active_user), database: Database = Depends(get_database)) -> WitnessResponse:
    return WitnessResponse.model_validate(report_service.get_witness(database, current_user, case_id, witness_id))


@router.patch("/witness-reports/{witness_id}/review", response_model=WitnessResponse)
def review_witness(case_id: UUID, witness_id: UUID, payload: WitnessReview, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> WitnessResponse:
    return WitnessResponse.model_validate(report_service.review_witness(database, current_user, case_id, witness_id, payload))


@router.post("/evidence", response_model=EvidenceResponse, status_code=201)
def create_evidence(case_id: UUID, payload: EvidenceCreate, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> EvidenceResponse:
    return EvidenceResponse.model_validate(report_service.create_evidence(database, current_user, case_id, payload))


@router.get("/evidence", response_model=list[EvidenceResponse])
def list_evidence(case_id: UUID, evidence_type: str | None = None, evidence_status: EvidenceStatus | None = None, current_user: CurrentUser = Depends(require_active_user), database: Database = Depends(get_database)) -> list[EvidenceResponse]:
    return [EvidenceResponse.model_validate(row) for row in report_service.list_evidence(database, current_user, case_id, evidence_type, evidence_status)]


@router.get("/evidence/{evidence_id}", response_model=EvidenceResponse)
def get_evidence(case_id: UUID, evidence_id: UUID, current_user: CurrentUser = Depends(require_active_user), database: Database = Depends(get_database)) -> EvidenceResponse:
    return EvidenceResponse.model_validate(report_service.get_evidence(database, current_user, case_id, evidence_id))


@router.patch("/evidence/{evidence_id}/review", response_model=EvidenceResponse)
def review_evidence(case_id: UUID, evidence_id: UUID, payload: EvidenceReview, current_user: CurrentUser = Depends(require_verified_user), database: Database = Depends(get_database)) -> EvidenceResponse:
    return EvidenceResponse.model_validate(report_service.review_evidence(database, current_user, case_id, evidence_id, payload))
