---
id: T23
title: Pod "Barakah meter" — character/community indicators, not just grades
phase: 7
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-05T18:15:00Z
completed: 2026-09-05T18:35:00Z
updated: 2026-09-05
depends_on: [T11]
tier: 2
build_or_mock: build
---

## Why
Answers a judge question no "AI tutor" pitch can: *what does this platform value
besides test scores?* Track soft indicators the community already cares about —
framed around adab and cooperation, not gamified points.

## Goal
- A lightweight per-pod (optionally per-student) set of soft indicators:
  attendance consistency, peer helpfulness (volunteer/self-reported), a short
  reflection log entry count.
- `pod_barakah_log` table (pod_id, student_user_id nullable, indicator, value, note,
  recorded_by, recorded_at).
- Admin/volunteer view: quick weekly check-in form. Parent view: a calm summary
  ("attends consistently; helps others in group sessions"), not a score.

## Done when
- [x] pod_barakah_log table (migration 0007) + a check-in form at /admin/barakah
      (pod / whole-pod-or-student / indicator / note / recorded-by)
- [x] Parent + admin see a values-framed summary — parent "Character & community"
      section (calm phrases + recent notes, no counts/scores); admin "Recent notes" list

## Notes (owner appends)
- Framing: indicators are attendance / cooperation / reflection / adab. No score, no
  rank, no leaderboard anywhere. Parent phrases are qualitative ("attends consistently",
  "helps others in group sessions").
- lib/db/barakah-queries.ts (listBarakahNotes, getChildBarakahSummary, addBarakahNote),
  app/admin/barakah/*, components/admin/BarakahCheckIn.tsx. Parent page gains a
  BarakahSummary block per child. Seed adds 5 notes.
- Needs `npm run migrate` + `npm run seed` on a live DB. build + lint green; not
  verified vs live data.
- commits: <t23>. Session tally: T10,T11,T13,T14,T15,T21,T23,T24.
