---
id: T65
title: Define + instrument the core metrics
phase: 13
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-06T06:05:00Z
updated: 2026-09-05
completed: 2026-09-05T00:00:00Z
outcome: >
  docs/metrics.md — the 7 metrics with exact formula, source table, cadence and
  target (completion rate, time-to-value, family retention 30d, at-risk count,
  volunteer churn, AI $/active student, waqf runway), plus the explicit
  instrumentation stance: no event pipeline, no third-party tracker — everything
  is derived on read from operational DB state (the deliberate privacy choice for
  a minors' product). getMissionHealth() in lib/db/analytics-queries.ts assembles
  the set from getLearningAnalytics + getMonthSpend (T56) + users.created_at /
  checkpoint timestamps. Surfaced as a "Mission health" band on /admin/analytics
  and a mission_health section in that page's CSV export. Verified live.
commits: 23d713c, 31d895e
depends_on: [T64]
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
You can't manage what you don't measure. Agree the metric set and emit the events for it.

## Done when
- [x] A written metric definitions doc — `docs/metrics.md` (all 7 metrics)
- [x] Instrumentation, privacy-respecting, no third-party tracker — derived on read
      from operational DB state; no event collection at all (documented as the stance)
- [x] A single 'mission health' view — the band on `/admin/analytics`

## Notes (owner appends)
- **Time series is the open follow-on.** Every metric is "as of now". A real
  "at-risk over the term" chart needs a periodic job writing an aggregate
  `analytics_snapshots` row (no per-student data) — build it on the compliance
  living-document (T20). Noted in `docs/metrics.md`.
- Time-to-value reads `null` on the demo seed because seeded checkpoint
  `attempted_at` is backdated before `users.created_at`; the median correctly
  drops invalid samples. Real usage has creation before activity.
- Waqf runway stays flagged illustrative (mock ledger, 4% draw assumption).
