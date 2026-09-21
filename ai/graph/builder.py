"""Evidence graph foundation for TraceOne.

This module keeps the graph simple, explicit, and explainable. Nodes represent evidence items,
and edges represent typed relationships between them.
"""

from __future__ import annotations

from collections import defaultdict
from typing import Any

import networkx as nx

from ai.graph.edges import EvidenceRelationship
from ai.graph.model import Evidence


class EvidenceGraph:
    """Simple in-memory evidence graph for an early TraceOne decision-support foundation."""

    def __init__(self) -> None:
        self.graph = nx.DiGraph()
        self.evidence: dict[str, Evidence] = {}

    def add_evidence(self, evidence: Evidence) -> Evidence:
        """Add a single evidence item as a node in the graph."""
        self.evidence[evidence.evidence_id] = evidence
        self.graph.add_node(evidence.evidence_id, data=evidence.to_dict())
        return evidence

    def get_evidence(self, evidence_id: str) -> Evidence:
        """Return evidence stored under the requested ID."""
        if evidence_id not in self.evidence:
            raise KeyError(f"Evidence not found: {evidence_id}")
        return self.evidence[evidence_id]

    def link_evidence(self, source_id: str, target_id: str, relationship: str | EvidenceRelationship) -> None:
        """Link two evidence entries with a relationship type."""
        if source_id not in self.evidence or target_id not in self.evidence:
            raise KeyError("Both evidence items must already exist in the graph.")
        rel = relationship.value if isinstance(relationship, EvidenceRelationship) else relationship
        self.graph.add_edge(source_id, target_id, relationship=rel)

    def get_neighbors(self, evidence_id: str) -> list[str]:
        """Return evidence IDs connected to a given item."""
        return list(self.graph.neighbors(evidence_id))

    def get_zone_evidence(self, zone_id: str) -> list[Evidence]:
        """Return all evidence items associated with a zone."""
        return [item for item in self.evidence.values() if item.zone_id == zone_id]

    def count_evidence_types_for_zone(self, zone_id: str) -> dict[str, int]:
        """Count evidence types seen within a zone."""
        counts: dict[str, int] = defaultdict(int)
        for evidence in self.get_zone_evidence(zone_id):
            counts[evidence.type.value] += 1
        return dict(counts)

    def export(self) -> dict[str, Any]:
        """Return a simple serializable snapshot of the current graph state."""
        return {
            "nodes": [self.evidence[item_id].to_dict() for item_id in sorted(self.evidence)],
            "edges": [
                {
                    "source": source,
                    "target": target,
                    "relationship": data.get("relationship"),
                }
                for source, target, data in self.graph.edges(data=True)
            ],
        }
