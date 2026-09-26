-- TraceOne RLS hardening for direct authenticated Supabase access.
-- The FastAPI service-role client bypasses RLS; service-layer authorization remains mandatory.
-- Apply in a reviewed Supabase migration after confirming deployed columns and RLS state.

create or replace function public.traceone_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id from public.profiles p where p.auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.traceone_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role::text from public.profiles p where p.auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.traceone_case_access(target_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cases c
    where c.id = target_case_id
      and (
        c.created_by = public.traceone_profile_id()
        or c.case_manager_id = public.traceone_profile_id()
        or public.traceone_profile_role() = 'SUPER_ADMIN'
        or exists (
          select 1
          from public.case_members cm
          where cm.case_id = c.id
            and cm.user_id = public.traceone_profile_id()
            and cm.status = 'ACTIVE'
            and cm.left_at is null
        )
      )
  );
$$;

-- RLS is enabled for application tables only. spatial_ref_sys is intentionally excluded.
alter table if exists public.profiles enable row level security;
alter table if exists public.cases enable row level security;
alter table if exists public.case_members enable row level security;
alter table if exists public.case_invites enable row level security;
alter table if exists public.zones enable row level security;
alter table if exists public.search_sessions enable row level security;
alter table if exists public.volunteer_locations enable row level security;
alter table if exists public.evidence enable row level security;
alter table if exists public.witness_reports enable row level security;
alter table if exists public.reports enable row level security;
alter table if exists public.ai_search_priorities enable row level security;
alter table if exists public.evidence_graph_nodes enable row level security;
alter table if exists public.evidence_graph_edges enable row level security;
alter table if exists public.possible_matches enable row level security;
alter table if exists public.search_expansions enable row level security;
alter table if exists public.case_publications enable row level security;
alter table if exists public.case_settings enable row level security;
alter table if exists public.police_notifications enable row level security;
alter table if exists public.notifications enable row level security;
alter table if exists public.case_timeline enable row level security;
alter table if exists public.device_sessions enable row level security;
alter table if exists public.sync_queue enable row level security;
alter table if exists public.audit_logs enable row level security;

-- Re-running this script replaces only its own policies.
drop policy if exists traceone_profiles_self_select on public.profiles;
create policy traceone_profiles_self_select on public.profiles for select to authenticated
using (auth_user_id = auth.uid());

drop policy if exists traceone_cases_scoped_select on public.cases;
create policy traceone_cases_scoped_select on public.cases for select to authenticated
using (public.traceone_case_access(id) or (is_public = true and status = 'PUBLIC_SEARCH'));

drop policy if exists traceone_case_members_scoped_select on public.case_members;
create policy traceone_case_members_scoped_select on public.case_members for select to authenticated
using (public.traceone_case_access(case_id));

drop policy if exists traceone_case_invites_manager_select on public.case_invites;
create policy traceone_case_invites_manager_select on public.case_invites for select to authenticated
using (public.traceone_profile_role() = 'SUPER_ADMIN' or exists (
  select 1 from public.cases c where c.id = case_id
    and (c.created_by = public.traceone_profile_id() or c.case_manager_id = public.traceone_profile_id())
));

drop policy if exists traceone_zones_case_select on public.zones;
create policy traceone_zones_case_select on public.zones for select to authenticated
using (public.traceone_case_access(case_id));

drop policy if exists traceone_sessions_case_select on public.search_sessions;
create policy traceone_sessions_case_select on public.search_sessions for select to authenticated
using (public.traceone_case_access(case_id));

drop policy if exists traceone_locations_private_select on public.volunteer_locations;
create policy traceone_locations_private_select on public.volunteer_locations for select to authenticated
using (volunteer_id = public.traceone_profile_id() or public.traceone_profile_role() = 'SUPER_ADMIN' or exists (
  select 1 from public.cases c where c.id = case_id
    and (c.created_by = public.traceone_profile_id() or c.case_manager_id = public.traceone_profile_id())
));

drop policy if exists traceone_evidence_case_select on public.evidence;
create policy traceone_evidence_case_select on public.evidence for select to authenticated
using (public.traceone_case_access(case_id));

drop policy if exists traceone_witness_case_select on public.witness_reports;
create policy traceone_witness_case_select on public.witness_reports for select to authenticated
using (public.traceone_case_access(case_id));

drop policy if exists traceone_reports_case_select on public.reports;
create policy traceone_reports_case_select on public.reports for select to authenticated
using (public.traceone_case_access(case_id));

drop policy if exists traceone_ai_priorities_case_select on public.ai_search_priorities;
create policy traceone_ai_priorities_case_select on public.ai_search_priorities for select to authenticated
using (public.traceone_case_access(case_id));

drop policy if exists traceone_graph_nodes_case_select on public.evidence_graph_nodes;
create policy traceone_graph_nodes_case_select on public.evidence_graph_nodes for select to authenticated
using (public.traceone_case_access(case_id));

drop policy if exists traceone_graph_edges_case_select on public.evidence_graph_edges;
create policy traceone_graph_edges_case_select on public.evidence_graph_edges for select to authenticated
using (public.traceone_case_access(case_id));

drop policy if exists traceone_possible_matches_case_select on public.possible_matches;
create policy traceone_possible_matches_case_select on public.possible_matches for select to authenticated
using (public.traceone_case_access(case_id));

drop policy if exists traceone_expansions_case_select on public.search_expansions;
create policy traceone_expansions_case_select on public.search_expansions for select to authenticated
using (public.traceone_case_access(case_id));

drop policy if exists traceone_publications_case_select on public.case_publications;
create policy traceone_publications_case_select on public.case_publications for select to authenticated
using (public.traceone_case_access(case_id));

drop policy if exists traceone_settings_case_select on public.case_settings;
create policy traceone_settings_case_select on public.case_settings for select to authenticated
using (public.traceone_case_access(case_id));

drop policy if exists traceone_police_case_select on public.police_notifications;
create policy traceone_police_case_select on public.police_notifications for select to authenticated
using (public.traceone_case_access(case_id));

drop policy if exists traceone_timeline_case_select on public.case_timeline;
create policy traceone_timeline_case_select on public.case_timeline for select to authenticated
using (public.traceone_case_access(case_id));

drop policy if exists traceone_notifications_self_select on public.notifications;
create policy traceone_notifications_self_select on public.notifications for select to authenticated
using (user_id = public.traceone_profile_id());

drop policy if exists traceone_device_sessions_self_select on public.device_sessions;
create policy traceone_device_sessions_self_select on public.device_sessions for select to authenticated
using (user_id = public.traceone_profile_id());

drop policy if exists traceone_sync_queue_self_select on public.sync_queue;
create policy traceone_sync_queue_self_select on public.sync_queue for select to authenticated
using (user_id = public.traceone_profile_id());

-- No ordinary authenticated-user policy is created for audit_logs. RLS therefore denies reads/writes.
-- No INSERT/UPDATE/DELETE policies are created for trusted server-derived fields.
-- The service-role backend remains the controlled write path.
