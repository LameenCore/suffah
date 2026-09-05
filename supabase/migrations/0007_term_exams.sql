-- Suffa — persisted term exams (T09).
--
-- The term exam is the unit-assessment machinery behind a flag: cumulative across
-- a whole course, timed, no remedial branch. Generated once from the course's
-- lessons and persisted here; term_exam_results (0001) holds each student attempt.
--
-- Run: npm run migrate

create table if not exists term_exams (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references courses(id) on delete cascade,
  term_label   text not null,
  exam_content jsonb not null,
  generated_by text not null,
  generated_at timestamptz not null default now(),
  unique (course_id, term_label)
);
