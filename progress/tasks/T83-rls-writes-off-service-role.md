---
id: T83
title: RLS — move user-action writes off the service-role client
phase: 9
status: todo
owner: —
claimed: —
updated: 2026-09-06
depends_on: [T82]
source: split from T82 (the writes axis)
---

## Why
Reads are on `getReadClient()` (T80/T82). Every `.insert()/.update()/.delete()`
still runs on the service-role client, so `0017_rls_write_policies.sql` is a
safety net, not the live check. Move the writes that represent a signed-in user
changing their own tenant's data.

## Done when
- [ ] Each user-action write in `app/**/actions.ts` + `lib/db/*` that a normal
      role performs (student submits a checkpoint, parent records consent, admin
      edits a course, volunteer adds a session note / board reply, …) runs on the
      request-scoped authed client so `0017`'s policies gate it
- [ ] Genuine system writes stay explicit on `getServiceClient()`: seed/migrate
      scripts, `lib/ai/continuity` briefing persistence, `lib/ai/budget` spend
      logging, `lib/audit`, provisioning, board moderation done by the platform
- [ ] `scripts/check-rls.ts` proves a cross-tenant write via the app path is
      refused for each moved table
- [ ] Per-route logged-in browser click-through for each role — no action 500s or
      is silently denied
- [ ] `check:rls`, `check:integrity`, vitest, `next build` green

## Notes (owner appends)
- Do this with the browser, not blind — a wrong write policy fails a legit action.
