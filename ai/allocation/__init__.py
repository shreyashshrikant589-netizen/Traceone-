"""Public APIs for the TraceOne smart volunteer allocation MVP."""

from ai.allocation.constraints import is_volunteer_eligible, is_zone_eligible
from ai.allocation.distance import calculate_distance_km
from ai.allocation.greedy import allocate_volunteers, calculate_allocation_score
from ai.allocation.optimizer import AllocationOptimizer, GreedyAllocator
from ai.allocation.schemas import (
    AllocationResult,
    VolunteerAssignment,
    VolunteerInput,
    VolunteerStatus,
    ZoneInput,
    ZoneStatus,
)

__all__ = [
    "AllocationOptimizer",
    "AllocationResult",
    "GreedyAllocator",
    "VolunteerAssignment",
    "VolunteerInput",
    "VolunteerStatus",
    "ZoneInput",
    "ZoneStatus",
    "allocate_volunteers",
    "calculate_allocation_score",
    "calculate_distance_km",
    "is_volunteer_eligible",
    "is_zone_eligible",
]
