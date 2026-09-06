---
id: T32
title: Volunteer logins + delegated pod access
phase: 9
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr (T32 fork)
claimed: 2026-09-06T00:00:00Z
updated: 2026-09-05
completed: 2026-09-06T00:00:00Z
outcome: >
  'volunteer' role added (lib/types.ts) + a 1:1 volunteers<->users link
  (migration 0018_volunteer_auth.sql: `alter type user_role add value`, partial
  unique index volunteers_user_id_key). New /volunteer route group: layout
  gates on getVolunteerContext() (unlinked account -> <VolunteerGate> "ask your
  masjid to link you"); page shows every pod the volunteer covers
  (pods.volunteer_id -> their volunteers.id, masjid-scoped) with read-only
  per-course pathway position + the handoff briefing, plus add-session-note and
  barakah check-in forms. Server actions (app/volunteer/actions.ts) re-check the
  volunteer session AND assertPodCoveredByVolunteer() before any write, and audit
  them. Admin side: VolunteerRow gains userId/userEmail; /admin/volunteers gets a
  "Link login" control (linkVolunteerLogin refuses a non-volunteer / wrong-masjid
  / already-linked email). Signup offers the volunteer role (account inert until
  linked). Demo: users.d9 (volunteer@suffa.demo, pw suffademo1234) linked to the
  Br. Kareem volunteers record covering Pod Al-Farabi; seed.sql + scripts/seed.ts
  + DEMO_USERS updated. i18n keys added to en.ts + fr.ts (check:i18n green).
  Verified live: /volunteer 200 renders Pod Al-Farabi; volunteer->/admin,/parent
  = 307; admin->/volunteer = 307; unlinked -> gate; delegation guard rejects a
  foreign pod; link guard rejects a non-volunteer email. eslint + next build +
  62 tests + check:integrity all green.
commits: <fill on merge>
depends_on: [T30]
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
Volunteers have no account today - they can't see their pod's progress or add
barakah/session notes themselves. The continuity story needs them in the loop.

## Done when
- [x] volunteers.user_id linked to a real login; a `volunteer` role + scoped delegate
      access (pods.volunteer_id -> volunteers.id -> user_id)
- [x] Read-only pod progress + continuity briefing for the assigned volunteer; they can add
      session + barakah notes
- [x] Cannot see other pods (assertPodCoveredByVolunteer), cannot see admin/ledger/
      compliance (requireRole redirects volunteer away from /admin, /parent)

## Notes (owner appends)
- Shared-file touches for the new role (all additive): `lib/types.ts` (Role + ROLES),
  `lib/auth/index.ts` (DEMO_USERS.volunteer), `proxy.ts` (PROTECTED += /volunteer),
  `components/Sidebar.tsx` (ROLE_LABEL_KEY += volunteer — mandatory, it's a
  Record<Role,...>). The other fork (T33) also adds to `lib/types.ts`/`lib/auth`/
  `proxy.ts` — expect a small union/array merge there.
- No volunteer button on the /login "try the demo" row (that list is a literal
  ["admin","parent","student"]); volunteers sign in with volunteer@suffa.demo or a
  `suffa-dev-role=volunteer` cookie.
- Migration number 0018 (0016 x2 + 0017 taken). `alter type ... add value` runs
  fine inside the migrate runner's per-file transaction on Supabase PG 15.
- Email invite for volunteer onboarding is T58; for now the volunteer self-signs-up
  and an admin links them by email on /admin/volunteers.
