"""Deterministic extraction of structured witness evidence from narrative text."""

from __future__ import annotations

from ai.graph.model import Evidence, EvidenceStatus, EvidenceType
from ai.nlp.parser import (
    build_extracted_entities,
    extract_clothing_hint,
    extract_color_hint,
    extract_destination_hint,
    extract_direction_hint,
    extract_location_hint,
    extract_object_hint,
    extract_person_hint,
    extract_time_hint,
)
from ai.nlp.schemas import WitnessExtractionResult, WitnessReportInput


def _estimate_confidence(entities: dict[str, object]) -> float:
    """Estimate extraction confidence from how many structured hints were found.

    This is operational confidence in the extraction process, not a probability that the
    witness statement is true.
    """
    score = 0.0
    count = 0
    if "person_type" in entities:
        score += 0.2
        count += 1
    if "clothing" in entities:
        score += 0.2
        count += 1
    if "colors" in entities:
        score += 0.1
        count += 1
    if "direction" in entities:
        score += 0.2
        count += 1
    if "location" in entities:
        score += 0.15
        count += 1
    if "destination" in entities:
        score += 0.15
        count += 1
    if "time_reference" in entities:
        score += 0.1
        count += 1
    if "object_hint" in entities:
        score += 0.1
        count += 1

    if count == 0:
        return 0.0
    return round(min(1.0, score), 4)


def extract_witness_report(report: WitnessReportInput) -> WitnessExtractionResult:
    """Extract a conservative set of witness facts into a structured result."""
    entities = build_extracted_entities(report.text)
    clothing = extract_clothing_hint(report.text)
    colors = extract_color_hint(report.text)
    direction = extract_direction_hint(report.text)
    location = extract_location_hint(report.text)
    destination = extract_destination_hint(report.text)
    time_reference = extract_time_hint(report.text)
    object_hint = extract_object_hint(report.text)
    person_type = extract_person_hint(report.text)

    result = WitnessExtractionResult(
        report_id=report.report_id,
        case_id=report.case_id,
        zone_id=report.zone_id,
        evidence_type=EvidenceType.WITNESS,
        person_type=person_type,
        age_hint=None,
        gender_hint=None,
        clothing=clothing or None,
        colors=colors or None,
        direction=direction,
        location=location,
        destination=destination,
        time_reference=time_reference,
        object_hint=object_hint,
        vehicle_hint=None,
        extracted_entities=entities,
        extraction_confidence=_estimate_confidence(entities),
        source=report.source,
        reported_at=report.reported_at,
    )
    return result


def witness_result_to_evidence(result: WitnessExtractionResult) -> Evidence:
    """Convert a witness extraction result into a structured Evidence item.

    The output is intentionally conservative and never marked as VERIFIED automatically.
    """
    details: list[str] = ["Witness report:"]

    if result.person_type:
        details.append(f"person: {result.person_type}")
    if result.clothing:
        details.append(f"clothing: {', '.join(result.clothing)}")
    if result.colors:
        details.append(f"colors: {', '.join(result.colors)}")
    if result.direction:
        details.append(f"direction: {result.direction}")
    if result.location:
        details.append(f"location: {result.location}")
    if result.destination:
        details.append(f"destination: {result.destination}")
    if result.time_reference:
        details.append(f"reported {result.time_reference}")
    if result.object_hint:
        details.append(f"object hint: {result.object_hint}")

    description = "; ".join(details)
    evidence = Evidence(
        evidence_id=f"witness-{result.report_id}",
        case_id=result.case_id,
        zone_id=result.zone_id,
        type=EvidenceType.WITNESS,
        location=result.location or result.zone_id or "unknown",
        timestamp=result.reported_at.isoformat(),
        description=description,
        confidence=round(float(result.extraction_confidence), 4),
        source=result.source,
        status=EvidenceStatus.RAW,
    )
    return evidence


def process_witness_report(report: WitnessReportInput, zone_input: object | None = None) -> dict[str, object]:
    """Extract a witness report and convert it into evidence plus an optional reprioritization result."""
    extracted = extract_witness_report(report)
    evidence = witness_result_to_evidence(extracted)

    payload: dict[str, object] = {
        "report": extracted,
        "evidence": evidence,
    }

    if zone_input is not None:
        from ai.priority.reprioritize import reprioritize_zone

        payload["reprioritized_zone"] = reprioritize_zone(zone_input, evidence)

    return payload
