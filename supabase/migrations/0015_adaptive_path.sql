-- Adaptive path: remediation branch + fast-track signal (T42).
--
-- The core loop gates on pass/fail. This adds two branches WITHIN objective
-- grading:
--   * two misses on a checkpoint -> a targeted AI re-teach (node_remediations),
--     shown before the next attempt.
--   * a strong first-try pass -> a "this student could move faster" signal for
--     the admin/volunteer (path_events, kind fast_track_suggested). Pods still
--     advance together, so this is a suggestion, not an auto-skip.

create table if not exists node_remediations (
  id                uuid primary key default gen_random_uuid(),
  student_user_id   uuid not null references users(id) on delete cascade,
  pathway_node_id   uuid not null references pathway_nodes(id) on delete cascade,
  missed_concepts   text[] not null default '{}',
  content           jsonb not null,          -- { summary, points[], examples[{prompt,solution}] }
  source            text not null default 'model',
  created_at        timestamptz not null default now(),
  unique (student_user_id, pathway_node_id)
);

create table if not exists path_events (
  id                uuid primary key default gen_random_uuid(),
  student_user_id   uuid not null references users(id) on delete cascade,
  pathway_node_id   uuid not null references pathway_nodes(id) on delete cascade,
  kind              text not null check (kind in (
                      'remediation_shown', 'remediation_passed', 'fast_track_suggested'
                    )),
  detail            jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now()
);

create index if not exists path_events_student_idx
  on path_events (student_user_id, created_at desc);
