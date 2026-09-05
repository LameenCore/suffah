-- Suffa — parent → child link.
--
-- 0001 models masjid, users (with role), pods and results, but nothing connects
-- a `parent` user to the `student` user(s) they monitor. The parent dashboard
-- (T10) is per-child, so it needs this. Kept as a join table: a family can have
-- several children, and (edge case) a child could have two guardian logins.
--
-- Run: npm run migrate  (or paste into the Supabase SQL editor).

create table if not exists parent_children (
  id              uuid primary key default gen_random_uuid(),
  parent_user_id  uuid not null references users(id) on delete cascade,
  student_user_id uuid not null references users(id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (parent_user_id, student_user_id)
);

create index if not exists parent_children_parent_idx
  on parent_children (parent_user_id);
