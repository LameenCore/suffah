---
id: T15
title: Volunteer onboarding form + churn log
phase: 6
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-05T16:55:00Z
completed: 2026-09-05T17:15:00Z
updated: 2026-09-05
depends_on: [T11]
outcome: /admin/volunteers — onboarding form (name + mock cert note, new volunteers start
  pending_vetting), a current-volunteers list with status toggles + "Record departure",
  and a churn log (departed volunteers with tenure). Departure stamps left_at, goes
  inactive, and detaches the volunteer from every pod while pod_progress is untouched —
  the continuity story. lib/db/volunteer-queries.ts + app/admin/volunteers/actions.ts
  ({ok,error}); no migration (volunteers table already has left_at). Seed gains a
  departed volunteer (Sr. Amina) so the log isn't empty.
commits: cf8920e
---

## Goal
Minimal volunteer onboarding form + a churn log in the admin dashboard — enough to carry
the churn-continuity story. Vetting is mocked.

## Done when
- [x] Onboarding form exists — /admin/volunteers OnboardForm
- [x] Churn log visible in admin — churn-log section + seeded departure

## Notes (owner appends)
- No migration: volunteers (0001) already has status + certification_note + left_at.
- Admin home "Volunteers" card now links to /admin/volunteers.
- Not verified vs live data (`.env.local` absent). build + lint green. New files only
  + admin/page.tsx link swap + seed rows — no overlap with the T08/T09 session.
