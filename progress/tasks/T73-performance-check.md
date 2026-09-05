---
id: T73
title: Performance: check it and be able to speak to it
phase: 14
status: done
owner: https://claude.ai/code/session_01KZau462fdpkrsdLZNLrD9T
claimed: 2026-09-06T02:00:00Z
completed: 2026-09-06T02:40:00Z
updated: 2026-09-05
depends_on: []
rubric: Technical 30% (sw)
source: MuslimHacks judging rubric (Business 40% / Technical 30% / Delivery 30%)
outcome: |
  docs/performance.md: method, before/after prod-build render times for every
  dashboard route, the N+1 fixes, and a "50 masjids" section (per-masjid scoping
  holds; needs secondary indexes + rollup/pagination for the admin compliance
  spread; move DB to ca-central-1). Batched 4 N+1 loops in lib/db + lib/compliance:
  listPods (2/pod -> ~4 total), getChildReport -> getChildReports (batched across
  children; the /admin compliance spread was ~7x4 queries, now ~7), sponsorship
  outcomes (4/row -> ~5 total), and the /parent double-fetch (assembleFromChildReport,
  pure). Measured wins (median, prod build, us-west-2 pooler): /parent -54%,
  /parent/compliance -72%, /admin -47%, /admin/compliance -63%, /admin/ledger -68%,
  /admin/pods -48%. Rendered output diffed before/after across 8 routes - identical
  bar report timestamps. build + lint + tsc + 38 tests + check:integrity green.
commits: 2c0aee7
---

## Why
Judges score "check and be ready to speak to performance". The dashboards do  N+1 Supabase
round-trips in places (listPods loops per pod; getChildReport loops  per course; sponsorship
outcomes loop per row). Measure the real page timings,  fix the worst N+1s, and write down
the numbers.

## Done when
- [x] Measured server render time for each dashboard route (prod build) - table in
      docs/performance.md (dev numbers were pure Next-dev overhead + noise from a
      parallel session mutating the shared DB; prod build is the honest measure)
- [x] The worst N+1 loops batched - 4 of them (listPods, getChildReport(s),
      sponsorship outcomes, /parent double-fetch)
- [x] 'if this had 50 masjids' section in docs/performance.md

## Notes (owner appends)
- 2026-09-05: getChildReport is now a thin wrapper over getChildReports (batch of
  one). Callers that need many reports (app/admin/page complianceSpread) use the
  batch directly + assembleFromChildReport.
- Indexes are NOT added here (needs a migration + touches every table) - listed in
  docs/performance.md and folded into T31 (RLS) which rewrites table DDL anyway.
