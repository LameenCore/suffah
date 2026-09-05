---
id: T73
title: Performance: check it and be able to speak to it
phase: 14
status: doing
owner: https://claude.ai/code/session_01KZau462fdpkrsdLZNLrD9T
claimed: 2026-09-06T02:00:00Z
updated: 2026-09-05
depends_on: []
rubric: Technical 30% (sw)
source: MuslimHacks judging rubric (Business 40% / Technical 30% / Delivery 30%)
---

## Why
Judges score "check and be ready to speak to performance". The dashboards do  N+1 Supabase
round-trips in places (listPods loops per pod; getChildReport loops  per course; sponsorship
outcomes loop per row). Measure the real page timings,  fix the worst N+1s, and write down
the numbers.

## Done when
- [ ] Measured server render time for each dashboard route (dev + a prod build) - a small
      table in docs/performance.md
- [ ] The 2-3 worst N+1 query loops batched (single query + group in memory)
- [ ] A 'if this had 50 masjids' paragraph: what stays fine, what needs an index or
      pagination

## Notes (owner appends)
