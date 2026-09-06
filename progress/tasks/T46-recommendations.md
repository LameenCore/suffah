---
id: T46
title: Next-step recommendations
phase: 11
status: done
owner: https://claude.ai/code/session_01KZau462fdpkrsdLZNLrD9T
claimed: 2026-09-06T12:20:00Z
updated: 2026-09-05
depends_on: [T43]
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
Students and volunteers should see 'what to work on next' - not a generic feed, a specific
pointer grounded in progress + the skill tree.

## Done when
- [x] Student: the single next action - a "Do this next" card on /student
      review)
- [x] Volunteer: "Focus this session" per pod on /admin/continuity
- [x] Deterministic priority ladder, each step carries its own "why"

## Outcome (session 01KZau4, 2026-09-05)

lib/recommendations.ts (deterministic priority ladder, no ranking):
- `getStudentNextStep(studentId, masjidId)` -> one `{kind,label,href,why}`.
  Order: review due -> blocked prereq (T43) -> read the re-teach (T42, 2+ misses)
  -> retry checkpoint -> take checkpoint -> finish/continue lesson -> caught up.
- `getPodFocus(podId, masjidId)` -> per student `{studentName,focus,why}`, only
  the students a volunteer can act on (drops "caught up" / "just do review").

Student: a "Do this next" card at the top of /student (links to the action).
Volunteer: a "Focus this session" panel per pod on /admin/continuity, labelled
"deterministic - from checkpoint history + the skill tree, not a model" (the T18
AI briefing is the narrative counterpart).
i18n key student.nextStep (card heading). 132 keys in sync.

Verified live: student sees "Do today's review (3)"; continuity shows per-student
focus with the plain "why". build + lint + tsc + 62 tests green.

## Notes (owner appends)
