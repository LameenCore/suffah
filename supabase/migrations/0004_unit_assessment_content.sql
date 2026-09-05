-- Suffa - persisted unit-assessment questions.
--
-- Same pattern as pathway_nodes.lesson_content / checkpoint_content: the
-- assessment is generated once from the unit's lessons and persisted, not
-- regenerated per view. unit_assessment_results (0001) holds each student's
-- attempt + score + pass/fail.
--
-- Run: npm run migrate

alter table units
  add column if not exists assessment_content jsonb;
