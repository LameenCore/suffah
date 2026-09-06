-- Platform super-admin + masjid lifecycle (T33).
--
-- A platform admin sits ABOVE masjid-admin: it provisions masjids and sees
-- cross-masjid operational health, but it is NOT a `user_role` value and carries
-- no per-masjid data access. Power comes solely from membership in this table;
-- the /platform routes use the service-role client and check membership.
--
-- Run: npm run migrate

create table if not exists platform_admins (
  user_id    uuid primary key references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- RLS on, no policy: unreachable from anon/authenticated (PostgREST). Only the
-- service-role client (which bypasses RLS) reads it, from server code that has
-- already authenticated the caller.
alter table public.platform_admins enable row level security;

-- Masjid lifecycle: a platform admin can suspend a masjid, which bounces its
-- users at the route guard until it is reactivated.
alter table public.masjids
  add column if not exists status text not null default 'active';

-- guard the allowed values without a hard enum (cheap to widen later)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'masjids_status_check'
  ) then
    alter table public.masjids
      add constraint masjids_status_check check (status in ('active', 'suspended'));
  end if;
end $$;
