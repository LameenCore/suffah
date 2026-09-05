-- Suffa - per-student lesson completion.
--
-- 0001 tracks a POD's position (pod_progress) and per-student assessment RESULTS,
-- but nothing records that an individual student finished reading a lesson node.
-- The Phase 2 loop needs that: lesson complete -> checkpoint unlocked -> advance.
--
-- Run: npm run migrate  (or paste into the Supabase SQL editor).

create table if not exists lesson_progress (
  id              uuid primary key default gen_random_uuid(),
  student_user_id uuid not null references users(id) on delete cascade,
  pathway_node_id uuid not null references pathway_nodes(id) on delete cascade,
  status          text not null default 'lesson_complete',  -- room for 'in_progress' later
  completed_at    timestamptz not null default now(),
  unique (student_user_id, pathway_node_id)
);

create index if not exists lesson_progress_student_idx
  on lesson_progress (student_user_id);
