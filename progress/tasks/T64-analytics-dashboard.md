---
id: T64
title: Learning analytics dashboard
phase: 13
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-06T05:35:00Z
updated: 2026-09-05
completed: 2026-09-05T00:00:00Z
outcome: >
  /admin/analytics — aggregate, read-only. lib/db/analytics-queries.ts
  getLearningAnalytics(masjidId): active students + rate, at-risk spread (reuses
  the compliance status engine so the definition matches what families see),
  per-course completion rate + unit-assessment pass rate + a drop-off histogram
  (students by furthest checkpoint passed), pod cohorts (students / avg progress /
  checkpoint pass / at-risk), volunteer churn rate (+ departures in 90d), and a
  rough waqf runway (4% annual draw + sadaqah vs committed outflow). Page renders
  stat cards + inline drop-off bars + a cohort table; "Export CSV" →
  GET /admin/analytics/export (analyticsToCsv, admin-only attachment). Nav item
  "Learning analytics" + new NavIcon "chart". Verified live against the demo
  masjid: 4 students, watch 2 / gap 2, 3 course histograms, 1 cohort, churn 33%,
  runway ~1.0yr; CSV renders. eslint + next build clean.
commits: PLACEHOLDER64
depends_on: []
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
Admins (and the mission) need engagement, drop-off, at-risk, and cohort views - beyond the
per-student compliance status.

## Done when
- [x] Admin dashboard: active students, completion rate per course/unit, drop-off points,
      at-risk count — `/admin/analytics`
- [x] Cohort view (by pod); volunteer churn rate; waqf runway vs burn
- [x] Read-only, aggregate, no new PII; export to CSV — `/admin/analytics/export`

## Notes (owner appends)
- **"At-risk count over time"** and **"cohort by term"** are shipped as the current
  snapshot only. A real time series needs periodic aggregate snapshots (a daily
  job writing a small `analytics_snapshots` row) — that job is the follow-on; the
  compliance "living document" (T20) is the closest existing thing to build it on.
- Waqf runway is explicitly labelled illustrative (4% draw assumption) — planning
  aid, not an accounting figure. Ties to the real ledger work (T13/T14) if that
  ever moves off mock data.
- Drop-off uses "furthest checkpoint *passed*" (distinct node titles) as the
  per-student position proxy — the only per-student signal `getChildReports`
  exposes without another query.
