---
id: T80
title: Finish moving user-facing lib/db reads onto getReadClient()
phase: 9
status: doing
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-06T00:30:00Z
updated: 2026-09-06
depends_on: [T79]
source: split from T79 (its 1st "done when" bullet — done as proof-of-pattern only)
---

## Why
T79 added `getReadClient()` and moved `parent-queries.ts` + `analytics-queries.ts`
reads onto it (RLS-enforced for a real session, service-role for the dev-role
demo). Every other `lib/db/*` read still uses `getServiceClient()`, so RLS is a
safety net there, not the live boundary. Finish the migration.

## Done when
- [ ] Reads in the remaining user-facing query files run through `getReadClient()`:
      `admin-queries.ts`, `queries.ts`, `barakah-queries.ts`, `continuity-queries.ts`,
      `contribution-queries.ts`, `exam-queries.ts`, `ledger-queries.ts`,
      `metrics-queries.ts`, `sponsorship-queries.ts`, `support-queries.ts`,
      `volunteer-queries.ts`, `consistency-queries.ts`, and the service-role reads
      inside `privacy-queries.ts`
- [ ] Genuinely cross-tenant / non-request jobs stay explicit on `getServiceClient()`:
      seed + migrate scripts, `lib/ai/continuity.ts` briefing generation,
      `lib/ai/budget.ts` spend rollups, `check-integrity` / `check-rls`
- [ ] Each dashboard, print route, API route and server action re-verified against
      a real signed-in session (not just the dev-role cookie) — RLS must not blank
      or 500 anything
- [ ] `npm run check:rls`, `npm run check:integrity`, vitest, `next build` all green

## Notes (owner appends)
- Writes are a separate axis: T79's `0017_rls_write_policies.sql` already scopes
  authed writes, but every `.insert()/.update()/.delete()` in the app still runs
  on service-role. Decide per call site whether to move it (user action) or keep
  it (system job) as part of this task.
- Consider tightening the `parent` SELECT policies from masjid-scope to
  relationship-scope (`parent_children`) so a parent can't read other families'
  rows even via a raw authed query.
