# TraceOne AI Integration

`ai/service.py` provides stable, side-effect-free Python wrappers for the existing AI decision-support modules.

## Service Functions

- `get_search_priority`
- `reprioritize_search`
- `extract_witness_evidence`
- `build_evidence_graph`
- `check_possible_match`
- `analyze_report_risk`
- `allocate_search_volunteers`
- `recommend_search_radius`
- `generate_police_case_summary`

Each function returns a `ServiceResult` with `success`, `status`, `result`, `model_version`, `generated_at`, and an optional `error`. Underlying structured results and module versions are preserved where available. Validation failures return a clear error result.

## Future Flow

Backend Request
-> Validation
-> AI Service
-> Existing AI Module
-> Structured Result
-> Backend stores result
-> Mobile/Manager consumes result

This layer does not add authentication, persistence, APIs, or external side effects. AI remains decision support. Human authorization is required for critical actions. The service does not confirm identity, claim an exact missing-person location, automatically notify police, close or publish cases, or ban users.
