"""Synthetic Dynamic Search Radius Intelligence demonstration."""

from __future__ import annotations

import sys
from pathlib import Path

if __package__ in (None, ""):
    repo_root = Path(__file__).resolve().parent.parent
    if str(repo_root) not in sys.path:
        sys.path.insert(0, str(repo_root))

from ai.radius import SearchRadiusInput, recommend_search_radius


def show(label: str, data: SearchRadiusInput) -> None:
    result = recommend_search_radius(data)
    print(label)
    print(f"- Stage: {result.current_stage.value}")
    print(f"- Recommended radius: {result.recommended_radius_km:.1f} km")
    print(f"- Next stage: {result.next_stage.value if result.next_stage else 'NONE'}")
    print(f"- Reasons: {result.reasons}")
    print()


def main() -> None:
    print("TraceOne Dynamic Search Radius Intelligence Demo")
    print("DEMO ONLY - synthetic evidence; not exact location prediction.\n")
    show("Initial venue search", SearchRadiusInput())
    show(
        "Evidence change: time and direction", 
        SearchRadiusInput(time_elapsed_min=90, recent_sighting_count=1, direction_match=0.8),
    )
    show(
        "Wider search review: exits and transport", 
        SearchRadiusInput(time_elapsed_min=180, recent_sighting_count=2, direction_match=0.9, exit_distance=1.0, connectivity_score=0.9, destination_match=0.8),
    )


if __name__ == "__main__":
    main()
