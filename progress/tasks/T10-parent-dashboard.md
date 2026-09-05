---
id: T10
title: Parent dashboard — progress + results per course
phase: 4
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-05T16:25:00Z
completed: 2026-09-05T16:45:00Z
updated: 2026-09-05
depends_on: [T07]
outcome: /parent renders one block per linked child, and per course a pathway progress
  bar (pod position / total nodes) + checkpoint, unit-assessment and term-exam result
  lists with pass/needs-review badges and dates. Read-only, revalidated each load so
  results show right after the student completes them. New migration 0004 adds
  parent_children (the family link was missing from the schema); seed links the demo
  parent → Yusuf. lib/db/parent-queries.ts; RegulationNote on evaluation formats.
commits: <t10>
---

## Goal
Read-only parent view: progress bar per course + checkpoint / assessment / exam results.
Must reflect a student's results immediately after they happen (demo step 2).

## Done when
- [x] /parent shows progress bar per course
- [x] Checkpoint / assessment / exam results listed per course

## Notes (owner appends)
- Schema had no parent→student relationship. Added migration `0004_parent_children.sql`
  (join table) + seed row (demo parent b1 → Yusuf c1) in both supabase/seed.sql and
  scripts/seed.ts. Needs `npm run migrate` then `npm run seed` on a live DB.
- Term-exam / unit-assessment rows will populate once T08/T09 generation runs; the view
  already reads term_exam_results + unit_assessment_results (both in 0001) and shows
  "None yet" until then.
- Not verified vs live data (`.env.local` absent). build + lint green. New files only
  + a full rewrite of app/parent/page.tsx (was a stub) — no overlap with T08.
