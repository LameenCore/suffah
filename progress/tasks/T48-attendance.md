---
id: T48
title: Enrichment-session attendance tracking
phase: 11
status: done
owner: https://claude.ai/code/session_01KZau462fdpkrsdLZNLrD9T
claimed: 2026-09-06T13:40:00Z
completed: 2026-09-06T21:45:00Z
updated: 2026-09-06
depends_on: [T32]
source: post-hackathon roadmap (EdTech-checklist analysis)
commits: 5656bb7 (claim), 93c70dc (implementation + root-cause fix)
outcome: >
  Migration 0021_attendance.sql adds enrichment_sessions + attendance_records
  (both masjid/pod-scoped, unique per pod+date and session+student). Volunteer
  portal gets an attendance form per pod (date, topic, present/absent/excused per
  student) via recordAttendanceAction -> recordSessionAttendance, audit-logged as
  attendance.recorded. Feeds: (1) T52 consistency - present dates count as active
  days; (2) continuity briefing - per-student present/absent over last ~6 sessions
  in renderSignals + fallbackBriefing watch-for; (3) parent view - per-child
  attendance summary card (counts + recent 4, no other family's detail). i18n EN/FR
  for both volunteer and parent strings. demo:reset wipes + reseeds two sessions
  (Idris misses the recent one). Verified: build/lint/tsc/test(68)/check:i18n(305)/
  check:integrity all green; live-checked queries return seeded data.
---

## Why
The volunteer runs in-person enrichment; attendance is a real signal for continuity, barakah
(consistency), and a family's engagement - and it is currently nowhere.

## Done when
- [x] Volunteer marks per-session attendance for their pod (present / absent / excused)
- [x] Feeds the continuity briefing ('X was quiet Thursday') and the Barakah consistency
      indicator
- [x] Parent sees their child's attendance summary; no raw per-session detail to other
      families

## Notes (owner appends)
- `enrichment_sessions.recorded_by` FK is `users(id)`; the demo home volunteer is a
  `volunteers` row, so demo:reset seeds sessions with `recorded_by: null`. Real
  recording passes the volunteer's linked user id.
- Attendance present-dates are `date`-typed (`yyyy-mm-dd`) and added to the T52 day
  set directly (no tz shift needed).
