# Backend/Mobile API Gap Report

This is a contract comparison only. It does not introduce routes or claim that the remote mobile interface is connected to the current checkout.

## Source state

- Current branch: `shreyash/backend`
- Current mobile source: not present; `mobile/` contains only `.gitkeep` plus local untracked environment/dependency artifacts.
- Compared mobile contract: `origin/main:mobile/services/api.ts`, inspected without switching branches.
- Current backend implementation: profile, case CRUD/listing, and case-member listing.

## Status categories

- **IMPLEMENTED**: backend route and service/database path exist.
- **PARTIALLY IMPLEMENTED**: related backend capability exists, but the mobile contract method or complete workflow is not covered.
- **BLOCKED BY DATABASE SCHEMA**: the required table metadata is unavailable.
- **NOT YET IMPLEMENTED**: no backend route exists and no schema-safe implementation was attempted.

| Mobile API method | Backend status | Notes |
|---|---|---|
| `getCurrentUser` | PARTIALLY IMPLEMENTED | JWT/profile resolution exists through `GET /api/v1/profile/me`; no route named `getCurrentUser`. |
| `listCases` | IMPLEMENTED | `GET /api/v1/cases`. |
| `getCase` | IMPLEMENTED | `GET /api/v1/cases/{case_id}` with private-case authorization. |
| `createCase` | IMPLEMENTED | `POST /api/v1/cases`; authenticated case-manager/admin path. |
| `getCaseDetails` | PARTIALLY IMPLEMENTED | Base case retrieval exists; extended details are not implemented. |
| `listCaseTimeline` | BLOCKED BY DATABASE SCHEMA | `case_timeline` metadata unavailable. |
| `previewJoinCase` | BLOCKED BY DATABASE SCHEMA | `case_invites` metadata unavailable. |
| `joinCase` | BLOCKED BY DATABASE SCHEMA | Invite and membership mutation constraints unavailable. |
| `listSearchZones` | BLOCKED BY DATABASE SCHEMA | `zones` metadata unavailable. |
| `listVolunteerAssignments` | BLOCKED BY DATABASE SCHEMA | Assignment relationship/schema unavailable. |
| `getMyAssignment` | BLOCKED BY DATABASE SCHEMA | Assignment relationship/schema unavailable. |
| `listSearchSessions` | BLOCKED BY DATABASE SCHEMA | `search_sessions` metadata unavailable. |
| `listEvidence` | BLOCKED BY DATABASE SCHEMA | `evidence` metadata unavailable. |
| `createEvidence` | BLOCKED BY DATABASE SCHEMA | `evidence` fields and review constraints unavailable. |
| `createSearchNote` | BLOCKED BY DATABASE SCHEMA | No verified persistence table or columns. |
| `listSightings` | BLOCKED BY DATABASE SCHEMA | Sighting/report schema unavailable. |
| `reportSighting` | BLOCKED BY DATABASE SCHEMA | Sighting/report schema unavailable. |
| `listNotifications` | BLOCKED BY DATABASE SCHEMA | `notifications` metadata unavailable. |
| `markNotificationRead` | BLOCKED BY DATABASE SCHEMA | Notification ownership/read-state fields unavailable. |
| `listPublicCases` | PARTIALLY IMPLEMENTED | Existing cases expose public visibility, but controlled publication schema is unavailable. |
| `getPublicCase` | PARTIALLY IMPLEMENTED | Public filtering exists at case access level; publication projection is not implemented. |
| `getPublicSearchAlert` | BLOCKED BY DATABASE SCHEMA | Alert/publication schema unavailable. |
| `getSearchPriority` | BLOCKED BY DATABASE SCHEMA | AI persistence contract unavailable. |
| `getPossibleMatch` | BLOCKED BY DATABASE SCHEMA | `possible_matches` metadata unavailable. |
| `reviewPossibleMatch` | BLOCKED BY DATABASE SCHEMA | Review persistence and authorization fields unavailable. |
| `getManagerOverview` | PARTIALLY IMPLEMENTED | Case counts can be derived from verified cases; the full mobile contract is not implemented. |
| `publishCase` | BLOCKED BY DATABASE SCHEMA | `case_publications` metadata unavailable. |
| `notifyPolice` | BLOCKED BY DATABASE SCHEMA | `police_notifications` metadata unavailable. |
| `getProfile` | IMPLEMENTED | `GET /api/v1/profile/me`. |
| `listSearchHistory` | BLOCKED BY DATABASE SCHEMA | Search-session schema unavailable. |

## Security invariants

- No service-role credential is sent to mobile.
- No invite, publication, police, audit, AI, or offline route was created without verified schema.
- Critical decisions remain backend-authorized human actions.
- Private case access remains server-side authorized.

## Next contract step

Provide exact metadata for `case_invites`, then implement secure preview/join and membership mutation as the first blocked workflow.