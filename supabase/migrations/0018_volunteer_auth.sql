-- Volunteer logins + delegated pod access (T32).
--
-- A volunteer becomes a real login: a `users` row with role='volunteer', linked
-- 1:1 to their `volunteers` record via volunteers.user_id (column already exists,
-- migration 0001). The volunteer portal (/volunteer) then shows only the pod(s)
-- where pods.volunteer_id points at that volunteers row.
--
-- PG 12+ allows `alter type ... add value` inside a transaction as long as the
-- new value is not *used* in the same transaction; nothing below uses it, so the
-- migrate runner's per-file BEGIN/COMMIT is fine on Supabase (PG 15).
--
-- Run: npm run migrate

alter type user_role add value if not exists 'volunteer';

-- One login per volunteer record. Partial: most volunteers have user_id null.
create unique index if not exists volunteers_user_id_key
  on volunteers (user_id)
  where user_id is not null;

-- RLS: `volunteers` already has volunteers_tenant_read from 0016_rls_policies
-- (scoped to app_masjid_id()); no new table, so no new policy needed.
