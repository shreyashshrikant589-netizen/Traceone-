-- TraceOne Migration: Add optional admins metadata extension table.
-- Existing profiles.role remains the authoritative primary RBAC source of truth.

create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  admin_type text not null default 'CASE_MANAGER' check (admin_type in ('SUPER_ADMIN', 'CASE_MANAGER')),
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz null
);

-- Enable RLS for direct authenticated Supabase access.
alter table if exists public.admins enable row level security;

-- Authenticated admins can view their own metadata; SUPER_ADMIN can view all.
drop policy if exists traceone_admins_self_select on public.admins;
create policy traceone_admins_self_select on public.admins for select to authenticated
using (
  user_id = public.traceone_profile_id()
  or public.traceone_profile_role() = 'SUPER_ADMIN'
);

-- No INSERT/UPDATE/DELETE policies are created for standard authenticated users.
-- The service-role FastAPI backend remains the controlled write path for administrator assignments.
