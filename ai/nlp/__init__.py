"""Witness NLP package exports for the TraceOne AI foundation."""

from ai.nlp.extractor import extract_witness_report, process_witness_report, witness_result_to_evidence
from ai.nlp.schemas import WitnessExtractionResult, WitnessReportInput

__all__ = [
    "WitnessExtractionResult",
    "WitnessReportInput",
    "extract_witness_report",
    "process_witness_report",
    "witness_result_to_evidence",
]
