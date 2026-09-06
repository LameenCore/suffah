-- Pod discussion / Q&A board (T47) + moderation scaffolding (T41).
--
-- A per-pod async space: students post questions, peers and the volunteer answer.
-- Threaded one level deep (a post is either a top-level question, thread_id
-- null, or a reply). No cross-pod visibility. Adults (volunteer/admin) are
-- always able to read every post including held ones.
--
-- Safety by design:
--   status 'held'   — auto-flagged (profanity / PII) or reported; shown only to
--                     the author + adults until an adult releases it
--   status 'visible'— published to the pod
--   status 'hidden' — taken down by an adult
--
-- Run: npm run migrate

create table if not exists pod_board_posts (
  id             uuid primary key default gen_random_uuid(),
  masjid_id      uuid not null references masjids(id) on delete cascade,
  pod_id         uuid not null references pods(id) on delete cascade,
  thread_id      uuid references pod_board_posts(id) on delete cascade,  -- null = top-level question
  author_user_id uuid not null references users(id) on delete cascade,
  author_role    text not null,                          -- 'student' | 'volunteer' | 'admin'
  body           text not null,
  status         text not null default 'visible',        -- 'visible' | 'held' | 'hidden'
  flag_reason    text,                                   -- 'profanity' | 'pii' | 'reported' | 'manual'
  created_at     timestamptz not null default now(),
  moderated_at   timestamptz,
  moderated_by   uuid references users(id) on delete set null
);

create index if not exists pod_board_posts_pod_idx
  on pod_board_posts (pod_id, created_at desc);
create index if not exists pod_board_posts_thread_idx
  on pod_board_posts (thread_id, created_at);
create index if not exists pod_board_posts_queue_idx
  on pod_board_posts (masjid_id, status) where status = 'held';

create table if not exists pod_board_reports (
  id               uuid primary key default gen_random_uuid(),
  post_id          uuid not null references pod_board_posts(id) on delete cascade,
  reporter_user_id uuid not null references users(id) on delete cascade,
  reason           text,
  created_at       timestamptz not null default now(),
  resolved_at      timestamptz,
  resolved_by      uuid references users(id) on delete set null,
  unique (post_id, reporter_user_id)
);

-- RLS: read scoped to the caller's masjid (0016 pattern). Writes stay on the
-- service-role client (server actions) for now — see T82.
alter table pod_board_posts enable row level security;
drop policy if exists pod_board_posts_tenant_read on pod_board_posts;
create policy pod_board_posts_tenant_read on pod_board_posts
  for select to authenticated
  using (
    exists (
      select 1 from public.pods p
      where p.id = pod_board_posts.pod_id and p.masjid_id = public.app_masjid_id()
    )
  );

alter table pod_board_reports enable row level security;
drop policy if exists pod_board_reports_tenant_read on pod_board_reports;
create policy pod_board_reports_tenant_read on pod_board_reports
  for select to authenticated
  using (
    exists (
      select 1 from public.pod_board_posts b
      join public.pods p on p.id = b.pod_id
      where b.id = pod_board_reports.post_id and p.masjid_id = public.app_masjid_id()
    )
  );
