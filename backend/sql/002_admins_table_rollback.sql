-- TraceOne Rollback: Remove admins metadata extension table safely.

drop policy if exists traceone_admins_self_select on public.admins;
drop table if exists public.admins cascade;
