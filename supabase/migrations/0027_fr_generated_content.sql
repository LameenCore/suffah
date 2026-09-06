-- Suffa — French (Quebec) copies of AI-generated content (T59 item 6).
--
-- The playground generates a lesson / checkpoint / unit assessment / term exam
-- ONCE per node and serves it from the database after that (PRD continuity
-- constraint). To offer the same content in French without disturbing the
-- English copy, we keep a sibling `*_fr` JSONB column next to each existing
-- content column. English stays in the original column (the default, and what
-- the demo runs on); French, when generated, lands in `*_fr`. A reader asking
-- for `fr` falls back to the English column when the French copy is absent.
--
-- Run: npm run migrate

alter table pathway_nodes
  add column if not exists lesson_content_fr jsonb;

alter table pathway_nodes
  add column if not exists checkpoint_content_fr jsonb;

alter table units
  add column if not exists assessment_content_fr jsonb;

alter table term_exams
  add column if not exists exam_content_fr jsonb;

-- Handoff briefings (pod_briefings) are append-only rows; tag each with the
-- locale it was generated in so the "latest briefing" lookup can be per-locale.
alter table pod_briefings
  add column if not exists locale text not null default 'en';
