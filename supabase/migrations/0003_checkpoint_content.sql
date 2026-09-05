-- Suffa — persisted checkpoint questions.
--
-- CLAUDE.md: every AI-generated lesson, checkpoint, and exam question must be
-- persisted, not regenerated on view. lesson_content already lives on the node;
-- this adds the checkpoint the same way. checkpoint_results (0001) still holds the
-- per-student attempt + pass/fail.
--
-- Run: npm run migrate

alter table pathway_nodes
  add column if not exists checkpoint_content jsonb;
