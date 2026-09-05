---
id: T22
title: Multi-generational knowledge sourcing for Seerah content
phase: 7
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-05T18:45:00Z
completed: 2026-09-05T19:05:00Z
updated: 2026-09-05
depends_on: [T05]
tier: 2
build_or_mock: mock
---

## Why
Seerah has no external curriculum vendor. Let the masjid's own scholars/elders react
to or expand AI-generated lesson drafts; their input gets woven into the next version
of the lesson. A genuine AI+community hybrid — not AI in a vacuum, not purely
human-authored. Only makes sense with exactly this community structure.

## Goal (hackathon: text version of the loop)
- A `lesson_contributions` table (node_id, contributor name/role, note text, created_at).
- Admin/scholar view: see a lesson draft, submit a note ("mention the boycott of Banu
  Hashim here", "the date is disputed — say 'around 610 CE'").
- "Incorporate contributions" action → `generateLessonForNode(..., { reviseWith:
  contributions })` regenerates the lesson folding the notes in; bump a version field.

## Done when
- [x] lesson_contributions table (migration 0008) + submit form at /admin/seerah
- [x] "Incorporate contributions" folds pending notes into the lesson —
      lib/ai/lesson-revision.ts incorporateContributions(): deterministic merge into
      a "Community input" section, marks contributions incorporated. Model rewrite is
      the productionization step (contract/persistence identical).
- [x] Lesson carries a version — communityRevision.version in lesson_content JSON;
      shown as "lesson vN · revised with community input"

## Notes (owner appends)
- Voice notes out of scope (mock tier) — text proves the pipeline; noted in the UI.
- lib/db/contribution-queries.ts (listSeerahNodes / listContributions / addContribution),
  lib/ai/lesson-revision.ts, app/admin/seerah/*, components/admin/SeerahContributions.tsx.
  Admin home gains a card. Seed adds 2 contributions on the Seerah node-1 lesson.
- No pathway_nodes ALTER — revision metadata lives in the lesson_content JSON.
- Needs `npm run migrate` + `npm run seed` + `npm run gen:lessons` on a live DB.
  build + lint green on the merged tree; not verified vs live data.
- Migration filename note: 0006/0007/0008 chosen sequentially; 0006 already collides
  with the other session's 0006_continuity_fingerprint (harmless — runner tracks full
  filenames).
- commits: <t22>. Session tally: T10,T11,T13,T14,T15,T21,T22,T23,T24.
