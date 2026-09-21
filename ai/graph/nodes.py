"""Simple constants and helpers for evidence node types."""

from __future__ import annotations

from enum import Enum


class EvidenceNodeType(str, Enum):
    """Supported evidence categories for the TraceOne graph MVP."""

    LAST_SEEN = "LAST_SEEN"
    WITNESS = "WITNESS"
    OBSERVATION = "OBSERVATION"
    DIRECTION = "DIRECTION"
    EXIT = "EXIT"
    CROWD_FLOW = "CROWD_FLOW"
    SEARCH_RESULT = "SEARCH_RESULT"
    SIGHTING = "SIGHTING"


EVIDENCE_NODE_TYPES = tuple(item.value for item in EvidenceNodeType)


def is_valid_evidence_node_type(value: str) -> bool:
    """Return True when the value matches a supported node type."""
    return value in EVIDENCE_NODE_TYPES
