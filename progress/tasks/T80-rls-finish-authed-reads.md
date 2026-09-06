---
id: T80
title: Finish moving user-facing lib/db reads onto getReadClient()
phase: 9
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-06T00:30:00Z
updated: 2026-09-06
completed: 2026-09-06T00:00:00Z
outcome: >
  All 13 named files + volunteer-portal-queries migrated: read functions now use
  `await getReadClient()`, write functions stay on `getServiceClient()` (done
  per-function by a read/write-aware pass — a function containing any
  .insert/.update/.delete/.upsert keeps the service client). `getReadClient()`
  hardened: it now try/catches the `cookies()` call and falls back to service-role
  when there is no request context, so a helper reused by a script or a
  cross-tenant job behaves exactly as before T80 (can't 500, can't blank).
  `lib/db/server.ts` also switched to a lazy `await import("next/headers")` so
  client components that import types from the query files don't drag `next/headers`
  into the browser bundle (this was breaking `next build`). Verified: next build,
  68 vitest, check:rls (15/15 — reads + writes refused cross-tenant),
  check:integrity, check:i18n all green; every dashboard 200 on the dev-role path;
  migrated helpers return data via the non-request fallback; check-rls already
  proves the authed SSR client (real Supabase sign-in) reads only its own masjid.
commits: PLACEHOLDER80
depends_on: [T79]
source: split from T79 (its 1st "done when" bullet — done as proof-of-pattern only)
---

## Why
T79 added `getReadClient()` and moved `parent-queries.ts` + `analytics-queries.ts`
reads onto it (RLS-enforced for a real session, service-role for the dev-role
demo). Every other `lib/db/*` read still uses `getServiceClient()`, so RLS is a
safety net there, not the live boundary. Finish the migration.

## Done when
- [x] Reads in the 13 named files (+ `volunteer-portal-queries.ts`) run through
      `getReadClient()`; writes stay on `getServiceClient()`
- [x] Cross-tenant / non-request jobs stay explicit on `getServiceClient()` — untouched;
      plus `getReadClient()` now self-heals to service-role outside a request context
- [~] Real-signed-in-session re-verification — done at the **data layer** (`check-rls`
      signs in for real and proves the authed client is masjid-scoped) and the
      **build/test layer**; a per-route browser click-through as a logged-in user is
      the residual (browser extension not connected this session — same class of
      residual as T60's screen-reader pass). The hardened fallback means the worst
      case is identical to pre-T80.
- [x] `check:rls`, `check:integrity`, vitest, `next build` green

## Notes (owner appends)
- **Out of scope, deferred to T82:** the newer query files not in the T80 list —
  `authoring-queries.ts`, `skill-tree-queries.ts`, `question-bank-queries.ts`,
  `attendance-queries.ts`, `path-queries.ts` (from T48/T50/T51, landed after T80 was
  written) — plus moving **writes** off service-role for genuine user actions, and
  tightening `parent` SELECT policies to relationship-scope.
- The `next/headers` → lazy `import()` change in `lib/db/server.ts` is load-bearing:
  a static import broke the client bundle once query files started importing from
  `lib/db/server`.
