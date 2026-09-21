"""Allocation optimizer abstraction for future global optimization methods."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Iterable

from ai.allocation.schemas import AllocationResult, VolunteerInput, ZoneInput


class AllocationOptimizer(ABC):
    """Interface for allocation strategies.

    The MVP uses greedy allocation. OR-Tools or Hungarian optimization can be added later
    without changing the public input and result schemas.
    """

    @abstractmethod
    def allocate(self, volunteers: Iterable[VolunteerInput], zones: Iterable[ZoneInput]) -> AllocationResult:
        raise NotImplementedError


class GreedyAllocator(AllocationOptimizer):
    """Active MVP allocator; global optimization is intentionally not claimed."""

    def allocate(self, volunteers: Iterable[VolunteerInput], zones: Iterable[ZoneInput]) -> AllocationResult:
        from ai.allocation.greedy import allocate_volunteers

        return allocate_volunteers(volunteers, zones)


# Future implementations: ORToolsAllocator and HungarianAllocator.
