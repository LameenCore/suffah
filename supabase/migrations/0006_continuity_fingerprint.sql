-- Suffa — Continuity Fingerprint (T18 / PRD §5.4).
--
-- Volunteer churn is the core operational pain. pod_progress says WHERE a pod is;
-- these two tables capture HOW it's been learning, so a handoff is a knowledge-
-- transfer event, not a data-loss event.
--
--   pod_session_notes  — short observations (volunteers after a live session, or
--                        the playground on notable events like a repeated checkpoint fail)
--   pod_briefings      — the generated AI handoff briefing, persisted so it's
--                        referenceable and not regenerated on every view
--
-- Run: npm run migrate

create table if not exists pod_session_notes (
  id           uuid primary key default gen_random_uuid(),
  pod_id       uuid not null references pods(id) on delete cascade,
  course_id    uuid references courses(id) on delete set null,
  author_kind  text not null default 'volunteer',   -- 'volunteer' | 'system'
  author_name  text,
  note         text not null,
  created_at   timestamptz not null default now()
);

create index if not exists pod_session_notes_pod_idx
  on pod_session_notes (pod_id, created_at desc);

create table if not exists pod_briefings (
  id           uuid primary key default gen_random_uuid(),
  pod_id       uuid not null references pods(id) on delete cascade,
  content      jsonb not null,
  generated_by text not null,                        -- model id or 'fallback'
  generated_at timestamptz not null default now()
);

create index if not exists pod_briefings_pod_idx
  on pod_briefings (pod_id, generated_at desc);
