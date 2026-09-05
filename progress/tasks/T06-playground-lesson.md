---
id: T06
title: Student playground — render lesson, mark complete
phase: 2
status: done
owner: https://claude.ai/code/session_01SKEypdSNQf7yjj5E411g4B
claimed: 2026-09-05T00:00:00Z
updated: 2026-09-05
completed: 2026-09-05T00:00:00Z
depends_on: [T05, T04]
outcome: /student lists the pod's 3 courses w/ status; /student/[courseId] renders the
  persisted lesson + "Mark lesson complete" (persists to new lesson_progress table,
  idempotent). Migration 0002 + npm run migrate (node-postgres). Verified end to end.
commits: 6294ba4, f6f676a, <t06>
---

## Goal
Student playground renders a persisted lesson and lets the student mark it complete,
writing progress to the relevant progress table.

## Done when
- [ ] /student renders a real lesson node
- [ ] "Mark complete" persists progress

## Notes (owner appends)
- New table `lesson_progress` (migration 0002) — per-student lesson completion.
  pod_progress stays pod-level; T07 gates advance on lesson_progress AND checkpoint pass.
- Routes: `/student` (list), `/student/[courseId]` (lesson). Server actions in
  `app/student/actions.ts` (completeLessonAction, ensureLessonAction) — role-checked.
- `GenerateLessonPanel` covers the case where a pod reaches a node with no lesson yet.
- Schema migrations now: `npm run migrate` (needs SUPABASE_DB_URL — must be the **pooler**
  URI, not db.<ref>.supabase.co which is IPv6-only).
