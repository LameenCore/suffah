-- Suffa — pod "barakah" notes (T23, differentiator).
--
-- Soft indicators the community already cares about — consistency, helping
-- others, reflection, adab in the circle — recorded as short observations, NOT
-- scores and NOT a leaderboard. A whole-pod note has student_user_id null.
--
-- Run: npm run migrate  (or paste into the Supabase SQL editor).

create table if not exists pod_barakah_log (
  id              uuid primary key default gen_random_uuid(),
  masjid_id       uuid not null references masjids(id) on delete cascade,
  pod_id          uuid not null references pods(id) on delete cascade,
  student_user_id uuid references users(id) on delete cascade,   -- null = whole-pod note
  indicator       text not null,        -- attendance | cooperation | reflection | adab
  note            text,
  recorded_by     text not null default 'volunteer',
  recorded_at     timestamptz not null default now()
);

create index if not exists pod_barakah_log_pod_idx on pod_barakah_log (pod_id);
create index if not exists pod_barakah_log_student_idx on pod_barakah_log (student_user_id);
