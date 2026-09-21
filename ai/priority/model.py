"""Priority model abstraction for the Search Priority Engine.

This file defines the contract for the active heuristic MVP and makes future learned-model
replacement straightforward. The current implementation is a transparent rule-based engine
that does not train or load a model.
"""

from __future__ import annotations

from typing import Any, Protocol

from ai.priority.features import SearchZoneInput


class SearchPriorityModel(Protocol):
    """Protocol defining the public contract for a search-priority implementation."""

    def predict(self, zone: SearchZoneInput) -> dict[str, Any]:
        """Return a structured priority result for the supplied zone."""
        ...


class HeuristicSearchPriorityModel:
    """The current active implementation is a heuristic MVP.

    Future versions may replace this with a trained model while keeping the same public
    interface and output structure.
    """

    model_version = "heuristic-mvp-v1"

    def predict(self, zone: SearchZoneInput) -> dict[str, Any]:
        from ai.priority.rules import evaluate_zone

        result = evaluate_zone(zone)
        result["model_version"] = self.model_version
        return result


ACTIVE_MODEL: SearchPriorityModel = HeuristicSearchPriorityModel()
