"""Simple constants and helpers for evidence relationship types."""

from __future__ import annotations

from enum import Enum


class EvidenceRelationship(str, Enum):
    """Supported relationship types for the evidence graph MVP."""

    LEADS_TO = "LEADS_TO"
    OBSERVED_AT = "OBSERVED_AT"
    DIRECTION_TOWARD = "DIRECTION_TOWARD"
    NEAR = "NEAR"
    FOLLOWED_BY = "FOLLOWED_BY"
    CORROBORATES = "CORROBORATES"
    CONTRADICTS = "CONTRADICTS"


EVIDENCE_RELATIONSHIPS = tuple(item.value for item in EvidenceRelationship)


def is_valid_relationship(value: str) -> bool:
    """Return True when the value matches a supported relationship type."""
    return value in EVIDENCE_RELATIONSHIPS
