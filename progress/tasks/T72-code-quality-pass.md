---
id: T72
title: Cohesion / coupling / readability pass
phase: 14
status: done
owner: https://claude.ai/code/session_01KZau462fdpkrsdLZNLrD9T
claimed: 2026-09-06T22:20:00Z
completed: 2026-09-06T22:35:00Z
updated: 2026-09-06
commits: f277828 (claim), 0585f79 (implementation)
outcome: >
  New lib/db/rel.ts owns unwrapRelation - the "PostgREST to-one embed is an object
  or a 1-element array, take first or null" step that was hand-inlined in ~15
  files. Replaced the local `rel`/`unwrap` function in authoring, question-bank,
  skill-tree, path, sponsorship, parent, review, continuity, admin, exam,
  volunteer-portal queries (imported aliased to the existing local name), and the
  inline `Array.isArray(x) ? x[0] : x` expressions in queries.ts, recommendations,
  ledger, audit, tutor, privacy, volunteer, attendance. Cohesion note added to
  docs/architecture-rationale.md ("How lib/ is organised"). The admin stat-card
  markup the task also flagged is already a shared <StatCard> component. No
  behaviour change: build + lint + tsc + 68 tests + check:i18n + check:integrity
  all green.
depends_on: []
rubric: Technical 30% (sw)
source: MuslimHacks judging rubric (Business 40% / Technical 30% / Delivery 30%)
---

## Why
Judges score code cohesion, coupling, and readability. Do a real pass: the  lib/db/*-queries
split, the lib/ai/* modules, the repeated Supabase  embedded-relation unwrap helper
(duplicated in 5+ files), the admin nav-card  markup repeated inline. Consolidate the
obvious duplication; leave a short  CODE-NOTES on the structure.

## Done when
- [x] A shared `unwrapRelation`/`deep` helper replacing the copy in queries.ts / admin-
      queries / parent-queries / ledger / sponsorship / barakah / contribution
      (barakah/contribution had no embed-unwrap; covered the ~18 files that did)
- [x] One code-cohesion note (docs/architecture-rationale.md or a comment header) on how
      lib/ is organised and why
- [x] eslint + tsc + tests still green; no behaviour change

## Notes (owner appends)
