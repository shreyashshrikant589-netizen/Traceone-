# TraceOne Database Schema Status

This document separates schema facts verified for the current backend work from metadata that is not available in the repository or runtime environment.

## Discovery status

The backend schema could not be introspected during this run because:

- `backend/.env` is not present.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are not present in the process environment.
- `DATABASE_URL` is not present.
- No local SQL migrations, schema dump, Supabase CLI configuration, or generated database types are available.
- The mobile public environment is not a safe substitute for backend schema metadata.

No row data was queried and no database changes were made.

## VERIFIED

The following column definitions were previously verified for TraceOne and are used by the backend services.

### public.profiles

| Column | Type | Nullable | Default |
|---|---|---:|---|
| `id` | `uuid` | no | `gen_random_uuid()` |
| `auth_user_id` | `uuid` | no | none |
| `full_name` | `text` | no | none |
| `phone` | `text` | yes | none |
| `email` | `text` | yes | none |
| `role` | `text` | no | `'VOLUNTEER'` |
| `avatar_url` | `text` | yes | none |
| `is_active` | `boolean` | no | `true` |
| `is_verified` | `boolean` | no | `false` |
| `created_at` | `timestamptz` | no | `now()` |
| `updated_at` | `timestamptz` | no | `now()` |

The application relationship used by authentication is `profiles.auth_user_id` to `auth.users.id`. The backend resolves the authenticated Auth user through this column, then uses `profiles.id` for application-level ownership and membership lookups.

### public.cases

| Column | Type | Nullable | Default |
|---|---|---:|---|
| `id` | `uuid` | no | `gen_random_uuid()` |
| `case_number` | `text` | no | none |
| `created_by` | `uuid` | no | none |
| `case_manager_id` | `uuid` | yes | none |
| `title` | `text` | no | none |
| `description` | `text` | yes | none |
| `status` | `text` | no | `'DRAFT'` |
| `priority` | `text` | no | `'MEDIUM'` |
| `event_name` | `text` | yes | none |
| `venue_name` | `text` | yes | none |
| `boundary` | `USER-DEFINED` | yes | none |
| `last_seen_location` | `USER-DEFINED` | yes | none |
| `last_seen_at` | `timestamptz` | yes | none |
| `known_destination` | `text` | yes | none |
| `initial_radius_m` | `numeric` | yes | none |
| `current_radius_m` | `numeric` | yes | none |
| `is_public` | `boolean` | no | `false` |
| `public_at` | `timestamptz` | yes | none |
| `resolved_at` | `timestamptz` | yes | none |
| `closed_at` | `timestamptz` | yes | none |
| `created_at` | `timestamptz` | no | `now()` |
| `updated_at` | `timestamptz` | no | `now()` |

The backend deliberately does not select or write `boundary` or `last_seen_location` until their concrete PostGIS type and serialization contract are verified.

### public.case_members

| Column | Type | Nullable | Default |
|---|---|---:|---|
| `id` | `uuid` | no | `gen_random_uuid()` |
| `case_id` | `uuid` | no | none |
| `user_id` | `uuid` | no | none |
| `role` | `text` | no | none |
| `status` | `text` | no | `'INVITED'` |
| `joined_at` | `timestamptz` | yes | none |
| `left_at` | `timestamptz` | yes | none |
| `created_at` | `timestamptz` | no | `now()` |
| `updated_at` | `timestamptz` | no | `now()` |

The current application contract uses `profiles.id` for `case_members.user_id`. The database foreign-key declaration and uniqueness/check constraints were not available to this backend runtime and remain unverified here.

### Verified but not fully discoverable metadata

The following are not available from the current repository/runtime and must not be inferred:

- Primary-key declarations beyond the column definitions above
- Foreign-key declarations for `cases.created_by`, `cases.case_manager_id`, or `case_members`
- Unique constraints
- Check constraints and enum-like allowed values
- Index definitions
- RLS enabled state and policies
- Concrete PostGIS type/output format for `boundary` and `last_seen_location`

## NOT AVAILABLE

The following tables could not be introspected:

- `case_invites`
- `zones`
- `search_sessions`
- `volunteer_locations`
- `evidence`
- `witness_reports`
- `reports`
- `case_timeline`
- `missing_persons`
- `notifications`
- `case_publications`
- `police_notifications`
- `ai_search_priorities`
- `evidence_graph_nodes`
- `evidence_graph_edges`
- `possible_matches`
- `case_settings`
- `device_sessions`
- `sync_queue`
- `audit_logs`

For these tables, columns, relationships, constraints, indexes, RLS, status values, and geometry types are unknown.

## PLANNED BUT NOT VERIFIED

The following concepts appear in the TraceOne design, but are not database contracts until metadata is supplied:

- Hashed invite tokens or join codes
- Zone geometry, priority, rank, and assignment fields
- Search-session lifecycle and ownership fields
- Volunteer location geometry and privacy rules
- Report/evidence distinction and media fields
- Timeline event columns and allowed event values
- Case publication records
- Police notification records
- AI priority and evidence graph persistence
- Offline idempotency and synchronization state
- Audit-log structure

No backend endpoint should query or mutate these planned tables until their actual schema is available.

## BACKEND IMPLEMENTATION BLOCKERS

The entries below are application-level requirements only. They are not claims about actual database columns, constraints, relationships, status values, indexes, RLS, or geometry types.

| Table | Current verification status | Why implementation is blocked | Required information before implementation | Related TraceOne feature |
|---|---|---|---|---|
| `case_invites` | NOT VERIFIED | No table metadata is available. | Exact columns for invite secret handling, expiry, status, usage, creator, and case relationship. | Secure QR/code join flow |
| `zones` | NOT VERIFIED | Zone persistence and geometry contract are unknown. | Exact columns, geometry type/serialization, assignment relationship, priority fields, status values, and constraints. | Search-zone management |
| `search_sessions` | NOT VERIFIED | Session ownership and lifecycle are unknown. | Exact case/user/zone relationships, lifecycle values, timestamps, and uniqueness rules. | Volunteer search sessions |
| `volunteer_locations` | NOT VERIFIED | Location storage and privacy boundaries are unknown. | Exact coordinate type, session/user relationship, timestamp and accuracy fields, indexes, and RLS. | Volunteer GPS tracking |
| `reports` | NOT VERIFIED | Raw intake structure is unknown. | Exact author/case fields, content fields, location/time fields, and status constraints. | Raw report intake |
| `witness_reports` | NOT VERIFIED | Witness-specific persistence is unknown. | Exact relationship to cases/reports/users and supported witness fields. | Witness reporting |
| `evidence` | NOT VERIFIED | Validated evidence structure is unknown. | Exact evidence fields, review/status values, media references, authorship, and case relationship. | Evidence submission/review |
| `case_timeline` | NOT VERIFIED | Timeline event schema and allowed event values are unknown. | Exact event columns, actor relationship, event constraints, and ordering fields. | Backend-generated case history |
| `missing_persons` | NOT VERIFIED | Person data is not available for safe use. | Exact case relationship, sensitive fields, visibility rules, and RLS. | Missing-person profile |
| `notifications` | NOT VERIFIED | Notification ownership and read-state fields are unknown. | Exact recipient relationship, payload fields, read/status values, and retention rules. | User notifications |
| `case_publications` | NOT VERIFIED | Publication workflow and public projection are unknown. | Exact case relationship, publication status/timestamps, reviewer fields, and public-safe columns. | Controlled public escalation |
| `police_notifications` | NOT VERIFIED | Police communication record structure is unknown. | Exact case/actor/status/provider fields and audit requirements. | Authorized police notification |
| `ai_search_priorities` | NOT VERIFIED | AI result persistence contract is unknown. | Exact zone/case relationship, score/reason fields, model version, review state, and timestamps. | AI search prioritization |
| `evidence_graph_nodes` | NOT VERIFIED | Graph persistence structure is unknown. | Exact evidence/node relationships, node types, and case ownership fields. | Evidence graph |
| `evidence_graph_edges` | NOT VERIFIED | Graph edge structure is unknown. | Exact node relationships, edge types, directionality, and case ownership fields. | Evidence graph relationships |
| `possible_matches` | NOT VERIFIED | Human-review match structure is unknown. | Exact source/candidate relationships, score, review status, reviewer, and decision fields. | Possible-match review |
| `case_settings` | NOT VERIFIED | Settings ownership and supported options are unknown. | Exact case relationship, setting fields, types, defaults, and authorization rules. | Case configuration |
| `device_sessions` | NOT VERIFIED | Device/session persistence is unknown. | Exact user/device/token metadata fields and security constraints. | Device/session security |
| `sync_queue` | NOT VERIFIED | Server synchronization contract is unknown. | Exact idempotency key, payload, status, version, conflict, ownership, and retry fields. | Offline synchronization |
| `audit_logs` | NOT VERIFIED | Audit event structure and retention are unknown. | Exact actor/action/resource fields, immutable-write policy, timestamps, and RLS. | Security and compliance audit |
