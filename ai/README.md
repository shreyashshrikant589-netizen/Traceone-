# TraceOne AI Module

This package provides the early AI decision-support foundation for TraceOne. It is intentionally lightweight and rule-aware, and it is designed to help prioritize investigations, extract evidence signals, rank zones, and support search planning.

## Purpose

The AI module is not an exact-location predictor and must not be treated as one. It should support human operators by surfacing likely signals, risky patterns, and prioritization suggestions from available case data.

## Core AI pipeline

Case Data -> Evidence -> Feature Extraction -> Search Priority Model -> Zone Priority -> Volunteer Allocation -> Search -> New Evidence -> Recalculate -> Updated Search Plan

## Planned modules

- Search Priority Engine
- Dynamic Reprioritization
- Witness NLP
- Evidence Graph
- Possible Match
- Suspicious/Fake Report Detection
- Smart Volunteer Allocation
- Dynamic Search Radius Intelligence
- AI Police Case Summary
- Offline AI Fallback

## Human control requirements

AI must never directly:
- confirm identity
- close a case
- publish a case
- notify police independently
- ban or suspend a user
- make an irreversible escalation

Critical actions remain human-controlled and auditable.

## Prototype guidance

Early prototype logic may use synthetic, sample, or rule-based data. These models are not trained production systems and must never be presented as real-world performance benchmarks.

## Expected structured output

```json
{
  "zone_id": "...",
  "priority_score": 0,
  "reasons": [],
  "model_version": "...",
  "generated_at": "..."
}
```

## Search Priority Engine — MVP

### Purpose

The Search Priority Engine is the first real AI/ML capability in TraceOne. It provides an explainable, rule-based score that helps human operators decide which search zones merit higher attention based on available evidence.

This score is called "AI-Assisted Search Priority" and it is a decision support signal, not an exact-location probability. It does not confirm identity, prove the missing person is in a location, or replace human review.

### Input features

The engine accepts validated zone-level inputs including:
- zone_id
- distance_km
- time_elapsed_min
- crowd_density
- crowd_flow_score
- exit_distance
- witness_count
- recent_sighting_count
- direction_match
- destination_match
- coverage_percent
- connectivity_score
- zone_reopened
- transport_proximity

### How the heuristic score works

The score combines several categories of supporting evidence and coverage penalties:
- recent sighting evidence
- witness reports
- direction and destination alignment
- crowd flow relevance
- proximity to exits and transport links
- area connectivity
- lower distance and lower time decay where appropriate
- reduced score when coverage is already high
- reduced score when a zone was reopened and may be stale

The current MVP uses transparent heuristic weights. They are prototype weights selected for explainability and are not statistically calibrated probabilities.

### Score range and priority levels

The score range is 0 to 100.

Priority levels:
- LOW: below 40
- MEDIUM: 40 to 69
- HIGH: 70 to 84
- CRITICAL: 85 and above

These thresholds are simple MVP thresholds for human review and should not be interpreted as official field risk metrics.

### Explainability

Every prediction returns structured reasons and feature contributions that show why the score changed. These reasons map directly to observed inputs instead of vague model statements.

### Synthetic/demo data

Synthetic demo data is included under [ai/data](ai/data) for development and demonstration only. This data is not real missing-person data and must never be presented as real-world distributions or training data.

### Current limitations

The current MVP is intentionally limited:
- no trained ML model yet
- no real-world calibrated probability claims
- no external API dependency
- no exact-location assertions
- no direct law-enforcement autonomy

### Future ML version

A future version may replace the heuristic engine with a trained model such as XGBoost or another suitable approach after proper dataset preparation, validation, and evaluation.

## Evidence Graph

Evidence is represented as a graph because investigation signals are rarely isolated. A witness report, a sighting, a directional clue, and a search result may all be connected to the same story and may reinforce or contradict one another. A graph makes those relationships explicit, inspectable, and easy to extend later.

Supported evidence types:
- LAST_SEEN
- WITNESS
- OBSERVATION
- DIRECTION
- EXIT
- CROWD_FLOW
- SEARCH_RESULT
- SIGHTING

Supported relationships:
- LEADS_TO
- OBSERVED_AT
- DIRECTION_TOWARD
- NEAR
- FOLLOWED_BY
- CORROBORATES
- CONTRADICTS

Evidence status states include:
- RAW
- PENDING_REVIEW
- VERIFIED
- SUSPICIOUS
- REJECTED

Current limitations:
- this is an in-memory graph for prototype work only
- edges are typed but not yet learned from large historical data
- evidence does not prove a location or person identity
- relationships are deterministic and human-readable, not statistically inferred

## Dynamic Reprioritization

TraceOne dynamically updates search priority as new evidence arrives. The system provides decision support; it does not determine an exact missing-person location.

Initial Evidence
→ Initial Search Priority
→ New Evidence
→ Feature Update
→ Recalculation
→ Updated Search Priority

The reprioritization flow validates the base zone and new evidence, updates only the relevant features, recalculates the score, compares the previous and new scores, and returns an audit-friendly result including score delta, level change, changed features, and fresh explanations.

The current evidence-to-feature mapping is a deterministic MVP rule set. It is intentionally simple and easy to replace later with more advanced logic, but it is not statistically validated and should not be presented as a calibrated model.

## Witness NLP — MVP

The witness NLP layer uses deterministic keyword-driven extraction, not a learned model. It supports English and basic Marathi cues for person hints, clothing, colors, direction, location, destination, and time references. The goal is to convert a short witness narrative into structured evidence for human review, not to assert that the statement is true.

Current implementation details:
- deterministic rule-based extraction
- supports English + basic Marathi vocabulary
- extracts structured witness hints into a `WitnessExtractionResult`
- evidence remains in `RAW` or `PENDING_REVIEW` state, never automatically `VERIFIED`
- extraction confidence measures confidence in the parsing step, not the truth of the witness statement
- witness evidence can feed the existing search-priority reprioritization pipeline
- unknown or vague text is handled conservatively with empty or `None` fields
- no external LLM or API is currently used

The witness workflow is:
- Witness text
- structured extraction
- `Evidence` conversion
- graph insertion
- reprioritization update if relevant

Future expansion may include:
- Gemini/LLM-assisted extraction
- NER and entity linking
- multilingual parsing improvements
- better temporal parsing
- better geospatial entity extraction

Any future LLM integration must remain human-in-the-loop and must not directly control critical case actions.

## Possible Match / Computer Vision - MVP

The possible-match layer compares two explicitly supplied case images and returns a similarity signal for human review. It must never be interpreted as identity confirmation.

The current pipeline is:

Candidate photo + missing-person photo
-> image quality check
-> face-detection adapter
-> deterministic face representation
-> cosine similarity
-> Possible Match classification
-> human verification

Current MVP behavior:
- basic integrity and dimension checks return an image-quality indicator
- face detection is a deterministic placeholder adapter; explicit synthetic face boxes are supported for multi-face tests, otherwise the valid image is used as a placeholder region
- face representations are normalized deterministic pixel features, not production biometric embeddings
- cosine similarity is safe for zero vectors and mismatched dimensions
- prototype thresholds are configurable and are not universal production thresholds
- candidate faces are ranked by similarity only
- every result requires human verification and uses review-oriented statuses such as `POSSIBLE_MATCH` and `HIGH_SIMILARITY_REVIEW`
- no external face API or large pretrained model is used

Privacy and security boundaries:
- comparisons are limited to explicitly supplied images for a case
- there is no public face search or global identity lookup
- no permanent biometric profile is created by this MVP
- production integration requires restricted access, secure storage, audit logging, and retention/deletion controls
- human review remains mandatory before any critical action

Future production architecture may add an approved detector and embedding model only after model evaluation, threshold calibration, privacy review, secure storage, audit logging, retention/deletion policy, and a human review workflow are established. Synthetic tests do not demonstrate real-world facial-recognition accuracy.

## Suspicious / Fake Report Detection - MVP

The anomaly layer identifies reports that deserve human review based on deterministic evidence-quality signals. It supports duplicate detection, consistency checks, reporter-history signals, corroboration signals, and explainable reasons.

Important distinction:

`suspiciousness_score != probability_of_fraud`

The score is a suspiciousness/review-risk signal. It is not a claim that a report is fake, and one report alone is not automatically suspicious. AI flags. A human reviews. A human decides.

Current MVP behavior:
- normalized-token/Jaccard duplicate text comparison
- duplicate attachment-hash detection
- similar location and close timestamp context matching
- invalid coordinate and future timestamp checks
- conservative rapid-location-change checks when related coordinates and timestamps are available
- explicit contradictory metadata signals when supplied
- neutral repeated-flagged-submission history signals
- corroborating reports can reduce review risk; low corroboration alone does not make a report fake
- configurable prototype weights and LOW/MEDIUM/HIGH thresholds
- deterministic explanations tied to emitted flags
- optional explicit conversion to `SUSPICIOUS` evidence; the scorer never changes report status automatically

The only actions are `NONE` and `REVIEW`. This MVP never automatically rejects a report, bans or suspends a user, closes a case, or notifies police. The thresholds are not scientifically calibrated and require labeled-data evaluation before production use.

Future work may include calibrated ML anomaly detection, graph-based anomaly detection, stronger semantic duplicate detection, historical evaluation data, precision/recall/F1 measurement, and threshold calibration. The current prototype is not trained on real fraud data.

## Smart Volunteer Allocation - MVP

The allocation layer matches eligible volunteers to search zones using existing zone priority scores. It is decision support only; a Case Manager reviews or changes assignments before any real coordination action.

Current MVP behavior:
- deterministic greedy allocation, considering higher-priority zones first
- availability and current-capacity constraints
- optional Haversine distance preference when coordinates are available
- lower coverage increases allocation need
- reopened zones are eligible; searched zones are skipped
- optional matching skills provide a modest suitability contribution
- assignments include suitability score, distance, reason, and `requires_review`
- insufficient supply is reported through unfilled zones and unassigned volunteers

The `allocation_score` means assignment suitability. It is not a probability that a volunteer will find the missing person, and the allocator does not dispatch or command volunteers automatically.

The active algorithm is greedy and local. Future work may add OR-Tools, Hungarian/global assignment optimization, dynamic reassignment, fairness/load balancing, and offline assignment support without changing the current decision-support boundary.

## Dynamic Search Radius Intelligence

This module recommends when a search area may need review for expansion as time and evidence change. It uses five stages: `VENUE`, `PERIMETER`, `ROADS_EXITS`, `TRANSPORT_NODES`, and `WIDER_AREA`.

The MVP is deterministic and considers elapsed time, recent sightings, direction, exits, coverage, destination alignment, connectivity, and the current radius. High coverage can prevent unnecessary expansion. The recommendation is search-area decision support, not an exact-location prediction; the Case Manager remains responsible for the final decision.

## AI Police Case Summary

This module produces a structured factual summary from supplied case details, evidence, and search activity. It preserves verified versus reported evidence, records timeline items, includes current search information, and lists unresolved fields without inventing facts.

The output is for human/admin review only. It does not confirm identity, claim that a person was found, make criminal or fraud claims, or send automatic police notifications.

## Notes

This is a decision-support foundation for TraceOne. The current MVP is transparent, explainable, and human-controlled. It is not a proof of person location or a trained operational model.
