---
id: T23
title: Pod "Barakah meter" — character/community indicators, not just grades
phase: 7
status: doing
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-05T18:15:00Z
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
- [ ] pod_barakah_log table + a check-in form (admin/volunteer)
- [ ] Parent + admin see a values-framed summary (no leaderboard, no points)

## Notes (owner appends)
- Framing matters: language is adab / cooperation / consistency, never "score" or "rank".
