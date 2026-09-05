-- Spaced-repetition review items (T44).
--
-- One row per (student, checkpoint question). Seeded from checkpoints the student
-- has already passed; scheduled with a simplified SM-2 (see lib/review.ts).

create table if not exists review_items (
  id                uuid primary key default gen_random_uuid(),
  student_user_id   uuid not null references users(id) on delete cascade,
  pathway_node_id   uuid not null references pathway_nodes(id) on delete cascade,
  question_id       text not null,            -- 'q1'..'qN' within the node's checkpoint
  ease              numeric(4,2) not null default 2.5,
  interval_days     integer not null default 0,
  reps              integer not null default 0,
  lapses            integer not null default 0,
  due_at            timestamptz not null default now(),
  last_reviewed_at  timestamptz,
  last_correct      boolean,
  unique (student_user_id, pathway_node_id, question_id)
);

create index if not exists review_items_due_idx
  on review_items (student_user_id, due_at);
