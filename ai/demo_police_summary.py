"""Synthetic police case summary demonstration."""

from __future__ import annotations

import sys
from pathlib import Path

if __package__ in (None, ""):
    repo_root = Path(__file__).resolve().parent.parent
    if str(repo_root) not in sys.path:
        sys.path.insert(0, str(repo_root))

from ai.police import generate_police_summary


def main() -> None:
    case = {
        "case_id": "synthetic-case-001",
        "person_description": "Child wearing a red shirt",
        "last_known_location": "North Gate",
        "last_known_time": "2026-09-21T09:30:00Z",
    }
    evidence = [
        {"evidence_id": "synthetic-e1", "type": "SIGHTING", "status": "VERIFIED", "location": "North Gate", "timestamp": "2026-09-21T09:30:00Z"},
        {"evidence_id": "synthetic-e2", "type": "WITNESS", "status": "PENDING_REVIEW", "description": "Direction toward the bus stand.", "timestamp": "2026-09-21T09:45:00Z"},
    ]
    search_activity = {"status": "IN_PROGRESS", "searched_zones": ["zone-1"], "current_search_area": "North Gate perimeter"}
    result = generate_police_summary(case, evidence, search_activity)

    print("TraceOne AI Police Case Summary Demo")
    print("Synthetic demonstration - human review required.\n")
    print(result.model_dump_json(indent=2))
    print("\nNo external notification was sent.")


if __name__ == "__main__":
    main()
