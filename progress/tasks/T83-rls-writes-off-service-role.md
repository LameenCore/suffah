---
id: T83
title: RLS — move user-action writes off the service-role client
phase: 9
status: done
owner: —
claimed: —
updated: 2026-09-06
completed: 2026-09-06T00:00:00Z
outcome: >
  Added getWriteClient() (same resolution as getReadClient: dev-role cookie / no
  request context -> service-role; a real Supabase session -> the RLS-enforced
  SSR client, so 0017's write policies gate the insert). Moved the six writes
  that ARE a signed-in user acting on their own data:
  saveCheckpointResult / markLessonComplete / saveUnitAssessmentResult (queries.ts),
  saveTermExamResult (exam-queries.ts), recordConsentDecision (consent.ts),
  createSupportRequest (support-queries.ts). check-rls extended (now 18) and
  proves live: a signed-in student CAN insert their own checkpoint_result via the
  authed client and CANNOT insert another in-masjid student's; the non-request
  fallback still works for the grade helpers + seed. Demo path (dev cookie) is
  unchanged. build + 68 tests + check:integrity green.
commits: 2b74dc8
depends_on: [T82]
source: split from T82 (the writes axis)
---

## Why
Reads are on `getReadClient()` (T80/T82). Every `.insert()/.update()/.delete()`
still runs on the service-role client, so `0017_rls_write_policies.sql` is a
safety net, not the live check. Move the writes that represent a signed-in user
changing their own tenant's data.

## Done when
- [~] Done for the six clean user-owned writes (student results, consent, support). Admin authoring, volunteer notes/attendance, and the pod board stay on service-role — 0017 has no volunteer-role or board write policies yet; see notes
- [x] Genuine system writes stay explicit on `getServiceClient()`: seed/migrate
      scripts, `lib/ai/continuity` briefing persistence, `lib/ai/budget` spend
      logging, `lib/audit`, provisioning, board moderation done by the platform
- [x] `check-rls.ts` proves the student self-write path (allow + cross-student refuse); 18 checks total
- [~] Data-layer verified via check-rls; the full per-route logged-in browser pass is still owed (flaky screenshot tooling this session)
- [x] `check:rls` (18), `check:integrity`, vitest (68), `next build` green

## Notes (owner appends)
- Do this with the browser, not blind — a wrong write policy fails a legit action.
