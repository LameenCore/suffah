---
id: T68
title: Cost-of-running + sustainability argument, defensible
phase: 14
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-06T02:50:00Z
completed: 2026-09-06T03:05:00Z
updated: 2026-09-05
depends_on: [T26]
rubric: Business 40%
source: MuslimHacks judging rubric (Business 40% / Technical 30% / Delivery 30%)
---

## Why
Judges want the ongoing run cost worked out and an argument it is sustainable.  T26 has the
unit economics; this hardens it into numbers a judge can push on:  per-masjid monthly cost,
per-active-student cost, the endowment size that  break-evens, and the sensitivity (what if
AI prices 2x, what if a masjid has 40  students not 12).

## Done when
- [x] docs/cost-model.md - per-call AI costs from the observed gen:* output sizes at
      Sonnet 5 rates (~$0.58 one-time per curriculum unit per masjid, ~$1/masjid/yr
      ongoing, $0 grading); infra (Supabase/Vercel/email, single vs shared); coordinator
      stipend as the one real lever
- [x] Break-even: ~$100K waqf @ 4% covers the base case; 3-scenario sensitivity table
      (Lean / Base / Stress w/ AI 3x + 40 students + own infra -> still ~$164K endowment)
- [x] The 3-sentence "why sustainable" + a "challenges a judge can push on" section;
      folded the headline into docs/qa-prep.md

## Notes (owner appends)
- Docs-only; no collision (T73 is on lib/db perf).
- Key reframe for the pitch: the cost risk is the COORDINATOR stipend, not the model -
  AI 10x is still ~$10/masjid/yr. Enrollment 12 -> 40 barely moves AI/infra (content is
  shared), it moves coordinator workload.
- Supersedes the rougher ~$0.30 / ~$6-10K numbers in T26 - pitch + qa-prep updated.
- commits: d3dda02
