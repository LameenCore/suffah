---
id: T11
title: Admin dashboard — pods, assignment, continuity view
phase: 4
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-05T14:20:00Z
completed: 2026-09-05T15:05:00Z
updated: 2026-09-05
depends_on: [T04]
outcome: /admin/pods renders pod cards (volunteer picker, student roster w/ add+remove)
  and a pod x course continuity matrix. Assignment enforces the 4-student cap, one-pod-per-
  student, and tenancy in app code (DB trigger is the backstop). Reads/writes in
  lib/db/admin-queries.ts; server actions in app/admin/pods/actions.ts return {ok,error}
  so the UI shows cap violations inline instead of a 500.
commits: <t11>
---

## Goal
Admin: pod list, pod assignment enforcing the hard 4-student cap, and a continuity view
showing pod_progress per pod per course (demo step 3: reassign volunteer, new one sees
current node instantly).

## Done when
- [x] Pod list renders
- [x] Assignment enforces max 4 students/pod
- [x] Continuity view shows current node per pod per course

## Notes (owner appends)
- New file `lib/db/admin-queries.ts` rather than appending to `lib/db/queries.ts` — the
  T06 owner is actively editing that file; keeping admin reads separate avoids a collision.
- Not verified against a live DB (`.env.local` absent in this checkout). Green on
  `next build` + `eslint`. The queries follow the same Supabase-JS patterns as T05/T06.
- `npm install` was needed (declared deps `pg`/`@types/pg` from the T06 commit weren't in
  node_modules here, breaking `next build`). Lockfile `libc`-field churn folded into the
  T11 commit.
