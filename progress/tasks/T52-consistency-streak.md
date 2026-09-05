---
id: T52
title: Consistency indicator (habit, not points)
phase: 11
status: done
owner: https://claude.ai/code/session_01KZau462fdpkrsdLZNLrD9T
claimed: 2026-09-06T06:50:00Z
completed: 2026-09-06T07:15:00Z
updated: 2026-09-05
outcome: |
  lib/db/consistency-queries.ts: getConsistency(studentId, masjidId) - counts
  DISTINCT calendar days (America/Toronto) with any learning activity from
  lesson_progress + checkpoint/unit/term results. No new table. Returns
  daysThisWeek, daysThisMonth, lastActive, and a 28-day active/inactive array.
  components/student/ConsistencyStrip.tsx: a calm teal card - "You've shown up N
  days in the last week", a 28-dot strip, and an explicit "only for you, never
  compared with anyone else" line. audience prop swaps the pronoun for the parent
  view. Shown on /student (below the courses) and per child on /parent.
  Ethos guardrails held: no streak counter, no badges/points/prizes, no
  loss-aversion "don't break your streak" copy; nothing cross-student. Empty
  state: "A little each day beats a lot once in a while. The first day counts."
  Verified live on /student and /parent. build + lint + tsc + 57 tests green.
commits: f3590ad
depends_on: []
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
The Barakah task deliberately avoided leaderboards/points. A gentle  'you've shown up N
days' habit nudge fits the ethos IF it never ranks students  or awards prizes.

## Done when
- [x] Per-student days engaged this week + month, on /student and per child on /parent
- [x] No comparison, no badges/points/prizes, no streak-break shaming (explicit
      "never compared with anyone else" line in the card)
- [x] Framed as consistency / itqan

## Notes (owner appends)
- 2026-09-05: day bucketing is America/Toronto so "today" matches the family, not
  the server. Activity signal = lesson_progress.completed_at + the three results
  tables' attempted_at.
