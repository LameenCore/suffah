---
id: T05
title: lib/ai/lesson.ts — generate + persist lesson nodes
phase: 2
status: done
owner: https://claude.ai/code/session_01SKEypdSNQf7yjj5E411g4B
claimed: 2026-09-05T00:00:00Z
updated: 2026-09-05
completed: 2026-09-05T00:00:00Z
depends_on: [T03]
outcome: lib/ai/lesson.ts (structured-output gen + persist, course-aware prompts,
  continuity guard, offline fallback), lib/db/queries.ts, POST /api/lessons/generate,
  npm run gen:lessons. All 3 courses' node 1 generated via model + persisted + verified.
commits: b0d4b63, 09f0a1c
---

## Goal
Generate and PERSIST one lesson node each for Math, Seerah, AI Literacy (Secondary 1 band).
Content is stored, never regenerated on view — pod continuity depends on stable content.
Read the claude-api skill before writing Anthropic calls.

## Done when
- [ ] lib/ai/lesson.ts generates a lesson for a given pathway_node
- [ ] Generated lesson persisted to the DB
- [ ] One lesson exists for each of the 3 courses

## Notes (owner appends)
- Model: claude-sonnet-5 (LESSON_MODEL in lib/ai/client.ts). Structured output via
  `messages.parse` + `zodOutputFormat` (zod v4).
- Persisted shape: `LessonContent` in lib/ai/lesson.ts — summary, objectives, sections,
  worked_example, practice (objective answers, feeds T07 checkpoint), key_terms,
  optional regulationNote (Math only).
- `generateLessonForNode` returns existing lesson untouched unless `{force:true}` —
  continuity guarantee. `npm run gen:lessons -- --force` to regenerate.
- Needed `npm run seed` first (demo DB was schema-only, no rows). See journal.
