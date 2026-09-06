---
id: T79
title: Move reads to the authed client + RLS write policies
phase: 9
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr (fork agent-ad973a8f668b60ab6)
claimed: 2026-09-06T00:00:00Z
completed: 2026-09-06T00:00:00Z
updated: 2026-09-06
depends_on: [T31]
source: split from T31 (its 2nd "done when" bullet)
commits: <fork branch worktree-agent-ad973a8f668b60ab6 — see journal>
outcome: >
  0017_rls_write_policies.sql adds INSERT/UPDATE/DELETE policies for the
  `authenticated` role on every writable table (helper app_user_id(); admin-only
  writes on the masjid-owned + curriculum + membership tables; result/activity
  rows insertable by the owning student or an in-masjid admin, no update/delete;
  support_requests self-insert + admin-resolve; consent_records guardian-or-admin
  insert only; audit_log / model_call_log / consent_records get NO authed-write
  policy — append-only triggers + service-role only). getReadClient() added to
  lib/db/server.ts (RLS-enforced authed client for a real session, service-role
  for the dev-role-cookie demo path). parent-queries.ts + analytics-queries.ts
  reads moved to getReadClient() as the proof-of-pattern; every other lib/db/*
  file and all writes still use service-role. check-rls.ts extended: 15 checks
  incl. two cross-tenant/privilege write refusals — all pass. check:integrity +
  62 vitest + `tsc --noEmit` clean.

## Done when
- [~] `lib/db/*-queries.ts` reads on the authed client — **partial by design**:
      `parent-queries.ts` + `analytics-queries.ts` migrated to `getReadClient()`
      as the pattern. Remaining files listed below → **T80**.
- [x] Per-table INSERT / UPDATE / DELETE policies (masjid + role scoped),
      mirroring the SELECT policies — `0017_rls_write_policies.sql`
- [x] `scripts/check-rls.ts` extended to prove a cross-tenant **write** is refused
      (parent→other-masjid result INSERT; parent→own-masjid `waqf_ledger` INSERT)
- [x] `npm run check:integrity` + vitest green; `tsc --noEmit` clean.
      **`next build` NOT run in the fork** — the worktree has no local
      `node_modules` and Turbopack refuses to resolve `next` from the parent tree;
      run it on merge. No route configs / client-server boundaries changed, so
      `tsc` covers the delta.

## Reads still on service-role (→ T80: finish the migration)
`admin-queries.ts`, `queries.ts`, `barakah-queries.ts`, `continuity-queries.ts`,
`contribution-queries.ts`, `exam-queries.ts`, `ledger-queries.ts`,
`metrics-queries.ts`, `sponsorship-queries.ts`, `support-queries.ts`,
`volunteer-queries.ts`, `consistency-queries.ts`, `privacy-queries.ts`
(its own service-role reads), plus every `.insert()/.update()/.delete()` across
`lib/db/*`, `lib/compliance/report.ts`, `lib/ai/*`, and the server actions —
those stay on `getServiceClient()`; T80 moves the user-facing ones onto
`getReadClient()` and keeps the genuinely cross-tenant jobs (briefings, spend
rollups, seed/migrate) explicit.

## Notes (owner appends)
- The `masjid_id`-first signature of every query helper stays — now a redundant
  guard on top of the DB policy, not the sole boundary.
- **RLS SELECT policies are masjid-scoped, not relationship-scoped.** A parent
  reading via the authed client can technically see *any* student's rows in their
  masjid; `getChildrenForParent` + the `parent_children` join is what still
  narrows the dashboard to their own children. Tightening RLS to
  relationship-scope for the `parent` role is a possible follow-up but wasn't in
  scope here.
- Merge note: `0017_rls_write_policies.sql` sits after the two `0016_*` files
  (repo already doubles 0006/0007/0009/0011/0016). Already applied to the live DB
  from the fork. `docs/architecture-rationale.md` "where tenancy is enforced"
  section + tradeoffs row rewritten for the T31+T79 state.
