from supabase import Client


class DatabaseError(RuntimeError):
    """Raised when a Supabase database operation fails."""


def execute(operation):
    try:
        response = operation()
    except Exception as error:
        raise DatabaseError("Database operation failed.") from error
    if getattr(response, "error", None):
        raise DatabaseError("Database operation failed.")
    return response.data


class Database:
    def __init__(self, client: Client) -> None:
        self.client = client

    def profile_by_auth_user_id(self, auth_user_id: str) -> dict | None:
        return execute(
            lambda: self.client.table("profiles")
            .select("id, auth_user_id, full_name, phone, email, role, avatar_url, is_active, is_verified, created_at, updated_at")
            .eq("auth_user_id", auth_user_id)
            .maybe_single()
            .execute()
        )

    def list_case_memberships_for_user(self, profile_id: str) -> list[dict]:
        return execute(
            lambda: self.client.table("case_members")
            .select("id, case_id, user_id, role, status, joined_at, left_at, created_at, updated_at")
            .eq("user_id", profile_id)
            .execute()
        ) or []

    def case_by_id(self, case_id: str) -> dict | None:
        return execute(
            lambda: self.client.table("cases")
            .select(CASE_COLUMNS)
            .eq("id", case_id)
            .maybe_single()
            .execute()
        )

    def cases_by_ids(self, case_ids: list[str]) -> list[dict]:
        if not case_ids:
            return []
        return execute(
            lambda: self.client.table("cases")
            .select(CASE_COLUMNS)
            .in_("id", case_ids)
            .execute()
        ) or []

    def list_cases(self) -> list[dict]:
        return execute(lambda: self.client.table("cases").select(CASE_COLUMNS).order("created_at", desc=True).execute()) or []

    def create_case(self, values: dict) -> dict:
        return execute(lambda: self.client.table("cases").insert(values).select(CASE_COLUMNS).single().execute())

    def update_case(self, case_id: str, values: dict) -> dict:
        return execute(
            lambda: self.client.table("cases")
            .update(values)
            .eq("id", case_id)
            .select(CASE_COLUMNS)
            .single()
            .execute()
        )

    def create_search_expansion(self, values: dict) -> dict:
        return execute(lambda: self.client.table("search_expansions").insert(values).select(SEARCH_EXPANSION_COLUMNS).single().execute())

    def list_search_expansions(self, case_id: str) -> list[dict]:
        return execute(lambda: self.client.table("search_expansions").select(SEARCH_EXPANSION_COLUMNS).eq("case_id", case_id).order("created_at", desc=True).execute()) or []

    def search_expansion_by_id(self, case_id: str, expansion_id: str) -> dict | None:
        return execute(lambda: self.client.table("search_expansions").select(SEARCH_EXPANSION_COLUMNS).eq("case_id", case_id).eq("id", expansion_id).maybe_single().execute())

    def update_search_expansion(self, case_id: str, expansion_id: str, values: dict) -> dict:
        return execute(lambda: self.client.table("search_expansions").update(values).eq("case_id", case_id).eq("id", expansion_id).select(SEARCH_EXPANSION_COLUMNS).single().execute())

    def case_settings_by_case_id(self, case_id: str) -> dict | None:
        return execute(lambda: self.client.table("case_settings").select(SETTINGS_COLUMNS).eq("case_id", case_id).maybe_single().execute())

    def create_case_settings(self, values: dict) -> dict:
        return execute(lambda: self.client.table("case_settings").insert(values).select(SETTINGS_COLUMNS).single().execute())

    def update_case_settings(self, case_id: str, values: dict) -> dict:
        return execute(lambda: self.client.table("case_settings").update(values).eq("case_id", case_id).select(SETTINGS_COLUMNS).single().execute())

    def list_case_publications(self, case_id: str, scope: str | None = None, publication_status: str | None = None) -> list[dict]:
        def query():
            builder = self.client.table("case_publications").select(PUBLICATION_COLUMNS).eq("case_id", case_id)
            if scope:
                builder = builder.eq("scope", scope)
            if publication_status:
                builder = builder.eq("status", publication_status)
            return builder.order("created_at", desc=True).execute()
        return execute(query) or []

    def create_case_publication(self, values: dict) -> dict:
        return execute(lambda: self.client.table("case_publications").insert(values).select(PUBLICATION_COLUMNS).single().execute())

    def update_case_publication(self, publication_id: str, values: dict) -> dict:
        return execute(lambda: self.client.table("case_publications").update(values).eq("id", publication_id).select(PUBLICATION_COLUMNS).single().execute())

    def list_active_profiles(self, role: str) -> list[dict]:
        return execute(lambda: self.client.table("profiles").select("id, is_active, is_verified, role").eq("role", role).eq("is_active", True).eq("is_verified", True).execute()) or []

    def create_police_notification(self, values: dict) -> dict:
        return execute(lambda: self.client.table("police_notifications").insert(values).select(POLICE_NOTIFICATION_COLUMNS).single().execute())

    def list_police_notifications(self, case_id: str, notification_status: str | None = None) -> list[dict]:
        def query():
            builder = self.client.table("police_notifications").select(POLICE_NOTIFICATION_COLUMNS).eq("case_id", case_id)
            if notification_status:
                builder = builder.eq("status", notification_status)
            return builder.order("created_at", desc=True).execute()
        return execute(query) or []

    def police_notification_by_reference(self, case_id: str, reference_id: str) -> dict | None:
        return execute(lambda: self.client.table("police_notifications").select(POLICE_NOTIFICATION_COLUMNS).eq("case_id", case_id).eq("reference_id", reference_id).maybe_single().execute())

    def update_police_notification(self, case_id: str, reference_id: str, values: dict) -> dict:
        return execute(lambda: self.client.table("police_notifications").update(values).eq("case_id", case_id).eq("reference_id", reference_id).select(POLICE_NOTIFICATION_COLUMNS).single().execute())

    def list_case_members(self, case_id: str) -> list[dict]:
        return execute(
            lambda: self.client.table("case_members")
            .select("id, case_id, user_id, role, status, joined_at, left_at, created_at, updated_at")
            .eq("case_id", case_id)
            .execute()
        ) or []

    def create_case_invite(self, values: dict) -> dict:
        return execute(
            lambda: self.client.table("case_invites")
            .insert(values)
            .select(INVITE_COLUMNS)
            .single()
            .execute()
        )

    def invite_by_token_hash(self, token_hash: str) -> dict | None:
        return execute(
            lambda: self.client.table("case_invites")
            .select(INVITE_COLUMNS)
            .eq("invite_token_hash", token_hash)
            .maybe_single()
            .execute()
        )

    def invite_by_join_code_hash(self, join_code_hash: str) -> dict | None:
        return execute(
            lambda: self.client.table("case_invites")
            .select(INVITE_COLUMNS)
            .eq("join_code_hash", join_code_hash)
            .maybe_single()
            .execute()
        )

    def consume_case_invite(self, invite: dict) -> dict | None:
        next_count = int(invite["used_count"]) + 1
        values = {"used_count": next_count}
        if invite.get("max_uses") is not None and next_count >= int(invite["max_uses"]):
            values["is_active"] = False

        query = (
            self.client.table("case_invites")
            .update(values)
            .eq("id", str(invite["id"]))
            .eq("is_active", True)
            .eq("used_count", int(invite["used_count"]))
        )
        if invite.get("max_uses") is not None:
            query = query.lt("used_count", int(invite["max_uses"]))
        return execute(lambda: query.select(INVITE_COLUMNS).maybe_single().execute())

    def membership_for_case_user(self, case_id: str, user_id: str) -> dict | None:
        return execute(
            lambda: self.client.table("case_members")
            .select(MEMBER_COLUMNS)
            .eq("case_id", case_id)
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )

    def create_membership(self, values: dict) -> dict:
        return execute(
            lambda: self.client.table("case_members")
            .insert(values)
            .select(MEMBER_COLUMNS)
            .single()
            .execute()
        )

    def reactivate_membership(self, membership_id: str, joined_at: str) -> dict:
        return execute(
            lambda: self.client.table("case_members")
            .update({"role": "VOLUNTEER", "status": "ACTIVE", "joined_at": joined_at, "left_at": None})
            .eq("id", membership_id)
            .select(MEMBER_COLUMNS)
            .single()
            .execute()
        )

    def leave_membership(self, membership_id: str, left_at: str) -> dict:
        return execute(
            lambda: self.client.table("case_members")
            .update({"status": "LEFT", "left_at": left_at})
            .eq("id", membership_id)
            .eq("status", "ACTIVE")
            .select(MEMBER_COLUMNS)
            .single()
            .execute()
        )

    def profile_by_id(self, profile_id: str) -> dict | None:
        return execute(
            lambda: self.client.table("profiles")
            .select("id, role, is_active, is_verified")
            .eq("id", profile_id)
            .maybe_single()
            .execute()
        )

    def zone_by_id(self, case_id: str, zone_id: str) -> dict | None:
        return execute(
            lambda: self.client.table("zones")
            .select(ZONE_COLUMNS)
            .eq("case_id", case_id)
            .eq("id", zone_id)
            .maybe_single()
            .execute()
        )

    def list_zones(self, case_id: str) -> list[dict]:
        return execute(
            lambda: self.client.table("zones")
            .select(ZONE_COLUMNS)
            .eq("case_id", case_id)
            .order("priority_rank", desc=False, nullsfirst=False)
            .order("priority_score", desc=True, nullsfirst=False)
            .order("created_at")
            .execute()
        ) or []

    def create_zone(self, values: dict) -> dict:
        return execute(lambda: self.client.table("zones").insert(values).select(ZONE_COLUMNS).single().execute())

    def update_zone(self, case_id: str, zone_id: str, values: dict) -> dict:
        return execute(
            lambda: self.client.table("zones")
            .update(values)
            .eq("case_id", case_id)
            .eq("id", zone_id)
            .select(ZONE_COLUMNS)
            .single()
            .execute()
        )

    def create_ai_search_priority(self, values: dict) -> dict:
        return execute(lambda: self.client.table("ai_search_priorities").insert(values).select(AI_PRIORITY_COLUMNS).single().execute())

    def list_ai_search_priorities(self, case_id: str) -> list[dict]:
        return execute(lambda: self.client.table("ai_search_priorities").select(AI_PRIORITY_COLUMNS).eq("case_id", case_id).order("rank").order("created_at", desc=True).execute()) or []

    def latest_ai_search_priority(self, case_id: str, zone_id: str) -> dict | None:
        return execute(lambda: self.client.table("ai_search_priorities").select(AI_PRIORITY_COLUMNS).eq("case_id", case_id).eq("zone_id", zone_id).order("created_at", desc=True).limit(1).maybe_single().execute())

    def list_evidence_graph_nodes(self, case_id: str) -> list[dict]:
        return execute(lambda: self.client.table("evidence_graph_nodes").select(GRAPH_NODE_COLUMNS).eq("case_id", case_id).order("created_at").execute()) or []

    def create_evidence_graph_node(self, values: dict) -> dict:
        return execute(lambda: self.client.table("evidence_graph_nodes").insert(values).select(GRAPH_NODE_COLUMNS).single().execute())

    def list_evidence_graph_edges(self, case_id: str) -> list[dict]:
        return execute(lambda: self.client.table("evidence_graph_edges").select(GRAPH_EDGE_COLUMNS).eq("case_id", case_id).order("created_at").execute()) or []

    def create_evidence_graph_edge(self, values: dict) -> dict:
        return execute(lambda: self.client.table("evidence_graph_edges").insert(values).select(GRAPH_EDGE_COLUMNS).single().execute())

    def session_by_id(self, case_id: str, session_id: str) -> dict | None:
        return execute(
            lambda: self.client.table("search_sessions")
            .select(SESSION_COLUMNS)
            .eq("case_id", case_id)
            .eq("id", session_id)
            .maybe_single()
            .execute()
        )

    def list_sessions(self, case_id: str, zone_id: str | None = None, volunteer_id: str | None = None, session_status: str | None = None) -> list[dict]:
        def query():
            builder = self.client.table("search_sessions").select(SESSION_COLUMNS).eq("case_id", case_id)
            if zone_id:
                builder = builder.eq("zone_id", zone_id)
            if volunteer_id:
                builder = builder.eq("volunteer_id", volunteer_id)
            if session_status:
                builder = builder.eq("status", session_status)
            return builder.order("created_at", desc=True).execute()

        return execute(query) or []

    def create_volunteer_location(self, values: dict) -> dict:
        return execute(lambda: self.client.table("volunteer_locations").insert(values).select(VOLUNTEER_LOCATION_COLUMNS).single().execute())

    def latest_volunteer_location(self, case_id: str, session_id: str, volunteer_id: str) -> dict | None:
        return execute(lambda: self.client.table("volunteer_locations").select(VOLUNTEER_LOCATION_COLUMNS).eq("case_id", case_id).eq("session_id", session_id).eq("volunteer_id", volunteer_id).order("recorded_at", desc=True).limit(1).maybe_single().execute())

    def list_volunteer_locations(self, case_id: str, session_ids: list[str] | None = None, volunteer_id: str | None = None, since: str | None = None, limit: int = 100) -> list[dict]:
        def query():
            builder = self.client.table("volunteer_locations").select(VOLUNTEER_LOCATION_COLUMNS).eq("case_id", case_id)
            if session_ids is not None:
                if not session_ids:
                    return []
                builder = builder.in_("session_id", session_ids)
            if volunteer_id:
                builder = builder.eq("volunteer_id", volunteer_id)
            if since:
                builder = builder.gte("recorded_at", since)
            return builder.order("recorded_at", desc=True).limit(limit).execute()
        return execute(query) or []

    def create_session(self, values: dict) -> dict:
        return execute(lambda: self.client.table("search_sessions").insert(values).select(SESSION_COLUMNS).single().execute())

    def update_session(self, session_id: str, values: dict) -> dict:
        return execute(
            lambda: self.client.table("search_sessions")
            .update(values)
            .eq("id", session_id)
            .select(SESSION_COLUMNS)
            .single()
            .execute()
        )

    def count_active_zone_sessions(self, case_id: str, zone_id: str) -> int:
        rows = self.list_sessions(case_id, zone_id=zone_id)
        return sum(1 for row in rows if row.get("status") in {"ACTIVE", "PAUSED"})

    def create_report(self, values: dict) -> dict:
        return execute(lambda: self.client.table("reports").insert(values).select(REPORT_COLUMNS).single().execute())

    def list_reports(self, case_id: str, report_status: str | None = None, report_type: str | None = None) -> list[dict]:
        def query():
            builder = self.client.table("reports").select(REPORT_COLUMNS).eq("case_id", case_id)
            if report_status:
                builder = builder.eq("status", report_status)
            if report_type:
                builder = builder.eq("report_type", report_type)
            return builder.order("created_at", desc=True).execute()
        return execute(query) or []

    def report_by_id(self, case_id: str, report_id: str) -> dict | None:
        return execute(lambda: self.client.table("reports").select(REPORT_COLUMNS).eq("case_id", case_id).eq("id", report_id).maybe_single().execute())

    def update_report(self, report_id: str, values: dict) -> dict:
        return execute(lambda: self.client.table("reports").update(values).eq("id", report_id).select(REPORT_COLUMNS).single().execute())

    def create_witness_report(self, values: dict) -> dict:
        return execute(lambda: self.client.table("witness_reports").insert(values).select(WITNESS_COLUMNS).single().execute())

    def list_witness_reports(self, case_id: str, report_status: str | None = None, reported_by: str | None = None) -> list[dict]:
        def query():
            builder = self.client.table("witness_reports").select(WITNESS_COLUMNS).eq("case_id", case_id)
            if report_status:
                builder = builder.eq("status", report_status)
            if reported_by:
                builder = builder.eq("reported_by", reported_by)
            return builder.order("reported_at", desc=True).execute()
        return execute(query) or []

    def witness_report_by_id(self, case_id: str, witness_id: str) -> dict | None:
        return execute(lambda: self.client.table("witness_reports").select(WITNESS_COLUMNS).eq("case_id", case_id).eq("id", witness_id).maybe_single().execute())

    def update_witness_report(self, witness_id: str, values: dict) -> dict:
        return execute(lambda: self.client.table("witness_reports").update(values).eq("id", witness_id).select(WITNESS_COLUMNS).single().execute())

    def create_evidence(self, values: dict) -> dict:
        return execute(lambda: self.client.table("evidence").insert(values).select(EVIDENCE_COLUMNS).single().execute())

    def list_evidence(self, case_id: str, evidence_type: str | None = None, evidence_status: str | None = None) -> list[dict]:
        def query():
            builder = self.client.table("evidence").select(EVIDENCE_COLUMNS).eq("case_id", case_id)
            if evidence_type:
                builder = builder.eq("evidence_type", evidence_type)
            if evidence_status:
                builder = builder.eq("status", evidence_status)
            return builder.order("created_at", desc=True).execute()
        return execute(query) or []

    def evidence_by_id(self, case_id: str, evidence_id: str) -> dict | None:
        return execute(lambda: self.client.table("evidence").select(EVIDENCE_COLUMNS).eq("case_id", case_id).eq("id", evidence_id).maybe_single().execute())

    def update_evidence(self, evidence_id: str, values: dict) -> dict:
        return execute(lambda: self.client.table("evidence").update(values).eq("id", evidence_id).select(EVIDENCE_COLUMNS).single().execute())

    def missing_person_photo_by_case(self, case_id: str) -> str | None:
        row = execute(lambda: self.client.table("missing_persons").select("photo_url").eq("case_id", case_id).maybe_single().execute())
        return row.get("photo_url") if row else None

    def create_possible_match(self, values: dict) -> dict:
        return execute(lambda: self.client.table("possible_matches").insert(values).select(POSSIBLE_MATCH_COLUMNS).single().execute())

    def list_possible_matches(self, case_id: str) -> list[dict]:
        return execute(lambda: self.client.table("possible_matches").select(POSSIBLE_MATCH_COLUMNS).eq("case_id", case_id).order("created_at", desc=True).execute()) or []

    def possible_match_by_id(self, case_id: str, match_id: str) -> dict | None:
        return execute(lambda: self.client.table("possible_matches").select(POSSIBLE_MATCH_COLUMNS).eq("case_id", case_id).eq("id", match_id).maybe_single().execute())

    def update_possible_match(self, case_id: str, match_id: str, values: dict) -> dict:
        return execute(lambda: self.client.table("possible_matches").update(values).eq("case_id", case_id).eq("id", match_id).select(POSSIBLE_MATCH_COLUMNS).single().execute())

    def sync_queue_by_operation(self, user_id: str, client_operation_id: str) -> dict | None:
        return execute(lambda: self.client.table("sync_queue").select(SYNC_QUEUE_COLUMNS).eq("user_id", user_id).eq("client_operation_id", client_operation_id).maybe_single().execute())

    def create_sync_queue(self, values: dict) -> dict:
        return execute(lambda: self.client.table("sync_queue").insert(values).select(SYNC_QUEUE_COLUMNS).single().execute())

    def list_sync_queue(self, user_id: str, device_session_id: str | None = None, queue_status: str | None = None, limit: int = 100) -> list[dict]:
        def query():
            builder = self.client.table("sync_queue").select(SYNC_QUEUE_COLUMNS).eq("user_id", user_id)
            if device_session_id:
                builder = builder.eq("device_session_id", device_session_id)
            if queue_status:
                builder = builder.eq("status", queue_status)
            return builder.order("created_at").limit(limit).execute()
        return execute(query) or []

    def sync_queue_by_id(self, user_id: str, queue_id: str) -> dict | None:
        return execute(lambda: self.client.table("sync_queue").select(SYNC_QUEUE_COLUMNS).eq("user_id", user_id).eq("id", queue_id).maybe_single().execute())

    def update_sync_queue(self, user_id: str, queue_id: str, values: dict) -> dict:
        return execute(lambda: self.client.table("sync_queue").update(values).eq("user_id", user_id).eq("id", queue_id).select(SYNC_QUEUE_COLUMNS).single().execute())

    def create_timeline_event(self, values: dict) -> dict:
        return execute(lambda: self.client.table("case_timeline").insert(values).select(TIMELINE_COLUMNS).single().execute())

    def list_timeline(self, case_id: str, limit: int, offset: int) -> list[dict]:
        return execute(
            lambda: self.client.table("case_timeline")
            .select(TIMELINE_COLUMNS)
            .eq("case_id", case_id)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        ) or []

    def create_notification(self, values: dict) -> dict:
        return execute(lambda: self.client.table("notifications").insert(values).select(NOTIFICATION_COLUMNS).single().execute())

    def list_notifications(self, user_id: str, notification_status: str | None, case_id: str | None, limit: int, offset: int) -> list[dict]:
        def query():
            builder = self.client.table("notifications").select(NOTIFICATION_COLUMNS).eq("user_id", user_id)
            if notification_status:
                builder = builder.eq("status", notification_status)
            if case_id:
                builder = builder.eq("case_id", case_id)
            return builder.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        return execute(query) or []

    def unread_notification_count(self, user_id: str) -> int:
        rows = execute(lambda: self.client.table("notifications").select("id, status").eq("user_id", user_id).neq("status", "READ").execute()) or []
        return len(rows)

    def notification_by_id(self, notification_id: str) -> dict | None:
        return execute(lambda: self.client.table("notifications").select(NOTIFICATION_COLUMNS).eq("id", notification_id).maybe_single().execute())

    def mark_notification_read(self, notification_id: str, read_at: str) -> dict:
        return execute(lambda: self.client.table("notifications").update({"status": "READ", "read_at": read_at}).eq("id", notification_id).select(NOTIFICATION_COLUMNS).single().execute())

    def mark_all_notifications_read(self, user_id: str, read_at: str) -> list[dict]:
        return execute(lambda: self.client.table("notifications").update({"status": "READ", "read_at": read_at}).eq("user_id", user_id).neq("status", "READ").select(NOTIFICATION_COLUMNS).execute()) or []


CASE_COLUMNS = (
    "id, case_number, created_by, case_manager_id, title, description, status, priority, "
    "event_name, venue_name, boundary, last_seen_location, last_seen_at, known_destination, initial_radius_m, current_radius_m, "
    "appearance, photo_url, "
    "is_public, public_at, resolved_at, closed_at, created_at, updated_at"
)
SETTINGS_COLUMNS = "id, case_id, allow_public_escalation, allow_public_sightings, allow_location_sharing, allow_photo_reports, auto_expire_publication, retention_days, created_at, updated_at"
PUBLICATION_COLUMNS = "id, case_id, published_by, scope, reason, approved_at, expires_at, status, created_at"
POLICE_NOTIFICATION_COLUMNS = "case_id, requested_by, status, reference_id, created_at, notified_at, acknowledged_at, closed_at"
AI_PRIORITY_COLUMNS = "id, case_id, zone_id, model_version, priority_score, rank, confidence, distance_score, time_score, crowd_score, exit_score, witness_score, coverage_score, direction_score, destination_score, explanation, created_at"
GRAPH_NODE_COLUMNS = "id, case_id, node_type, reference_id, location, timestamp, description, confidence, created_at"
GRAPH_EDGE_COLUMNS = "id, case_id, source_node_id, target_node_id, relationship_type, weight, confidence, created_at"
POSSIBLE_MATCH_COLUMNS = "id, case_id, reported_by, source_image_url, candidate_image_url, similarity_score, model_version, status, reviewed_by, reviewed_at, created_at"
SEARCH_EXPANSION_COLUMNS = "id, case_id, stage, previous_radius_m, new_radius_m, reason, recommended_by, approved_by, status, created_at"
SYNC_QUEUE_COLUMNS = "id, user_id, device_session_id, client_operation_id, operation_type, entity_type, entity_id, payload, status, attempt_count, last_attempt_at, synced_at, error_message, created_at, updated_at"

INVITE_COLUMNS = "id, case_id, created_by, invite_token_hash, join_code_hash, expires_at, max_uses, used_count, is_active, created_at"
MEMBER_COLUMNS = "id, case_id, user_id, role, status, joined_at, left_at, created_at, updated_at"
ZONE_COLUMNS = "id, case_id, name, description, geometry, status, priority_score, priority_rank, assigned_volunteer_id, created_at, updated_at"
SESSION_COLUMNS = "id, case_id, zone_id, volunteer_id, status, started_at, ended_at, start_location, end_location, notes, verification_status, created_at, updated_at"
VOLUNTEER_LOCATION_COLUMNS = "id, case_id, volunteer_id, session_id, location, accuracy_m, speed, heading, recorded_at, created_at"
REPORT_COLUMNS = "id, case_id, reporter_id, report_type, description, location, status, reviewed_by, reviewed_at, created_at"
WITNESS_COLUMNS = "id, case_id, evidence_id, reported_by, description, reported_at, observed_at, location, person_description, direction, clothing, confidence, status, created_at, updated_at"
EVIDENCE_COLUMNS = "id, case_id, submitted_by, evidence_type, description, location, occurred_at, confidence, source, photo_url, status, created_at, updated_at"
TIMELINE_COLUMNS = "id, case_id, actor_id, event_type, description, metadata, created_at"
NOTIFICATION_COLUMNS = "id, user_id, case_id, type, title, message, data, status, sent_at, read_at, created_at"
