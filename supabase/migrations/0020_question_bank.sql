-- Question bank overrides + item analytics support (T51).
--
-- Questions live inside pathway_nodes.checkpoint_content / units.assessment_content
-- / term_exams.exam_content JSON. This sparse table records per-question admin
-- overrides (disable a weak/miskeyed item, a note). Absence of a row = enabled.
-- Item analytics (p-value, discrimination) are computed at read time from
-- checkpoint_results.answer_data - no storage needed.

create table if not exists question_overrides (
  id           uuid primary key default gen_random_uuid(),
  masjid_id    uuid not null references masjids(id) on delete cascade,
  source_kind  text not null check (source_kind in ('checkpoint', 'unit', 'term')),
  source_id    text not null,          -- pathway_node id | unit id | term_exams id
  question_id  text not null,          -- 'q1'..'qN' within that source's content
  disabled     boolean not null default false,
  note         text,
  updated_at   timestamptz not null default now(),
  unique (masjid_id, source_kind, source_id, question_id)
);

create index if not exists question_overrides_masjid_idx on question_overrides (masjid_id);
