-- Suffa - in-app help / bug reports.
--
-- Any signed-in user (student, parent, volunteer-less-for-now) can send a
-- question or bug report to the masjid admin, who sees the open count in the
-- sidebar and works the queue on /admin/inbox.
--
-- Run: npm run migrate

create table if not exists support_requests (
  id           uuid primary key default gen_random_uuid(),
  masjid_id    uuid not null references masjids(id) on delete cascade,
  from_user_id uuid not null references users(id) on delete cascade,
  from_role    text not null,
  from_name    text not null,
  category     text not null default 'question',   -- 'question' | 'bug' | 'idea'
  subject      text not null,
  body         text not null,
  status       text not null default 'open',       -- 'open' | 'resolved'
  admin_note   text,
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz
);

create index if not exists support_requests_masjid_idx
  on support_requests (masjid_id, status, created_at desc);
