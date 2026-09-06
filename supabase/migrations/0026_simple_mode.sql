-- Cognitive-accessibility "simple mode" for the student playground (T66).
--
-- A lower-load presentation of the student surface: bigger type, more space,
-- decorative motifs + motion removed, secondary panels hidden. Same content and
-- assessments underneath — presentation only.
--
-- Resolution (mirrors locale): the `suffa-simple` cookie wins for the session;
-- `users.simple_mode` is the persisted per-student default that a parent or
-- volunteer can set.
--
-- Run: npm run migrate

alter table users add column if not exists simple_mode boolean not null default false;
