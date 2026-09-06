---
id: T72
title: Cohesion / coupling / readability pass
phase: 14
status: doing
owner: https://claude.ai/code/session_01KZau462fdpkrsdLZNLrD9T
claimed: 2026-09-06T22:20:00Z
updated: 2026-09-06
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
- [ ] A shared `unwrapRelation`/`deep` helper replacing the copy in queries.ts / admin-
      queries / parent-queries / ledger / sponsorship / barakah / contribution
- [ ] One code-cohesion note (docs/architecture-rationale.md or a comment header) on how
      lib/ is organised and why
- [ ] eslint + tsc + tests still green; no behaviour change

## Notes (owner appends)
