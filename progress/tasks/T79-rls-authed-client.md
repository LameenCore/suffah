---
id: T79
title: Move reads to the authed client + RLS write policies
phase: 9
status: todo
owner: —
claimed: —
updated: 2026-09-05
depends_on: [T31]
source: split from T31 (its 2nd "done when" bullet)
---

## Why
T31 enabled RLS + SELECT policies on every table and proved cross-tenant reads
are refused (`npm run check:rls`). But the server still does all DB access
through the **service-role** client, which bypasses RLS — so RLS is only a
safety net, not the live boundary. This task makes it the live boundary for
reads, and adds the write policies that were deferred.

## Done when
- [ ] `lib/db/*-queries.ts` reads run through the request-scoped anon/authed
      Supabase client (RLS-enforced) wherever the caller is a signed-in user;
      service-role reserved for genuine cross-tenant/admin jobs (seed, migrate,
      briefings, spend metering, integrity checks)
- [ ] Per-table INSERT / UPDATE / DELETE policies (masjid + role scoped), mirroring
      the SELECT policies added in `0016_rls_policies.sql`
- [ ] `scripts/check-rls.ts` extended to prove a cross-tenant **write** is refused
- [ ] Every dashboard + action re-verified end-to-end; `npm run check:integrity`
      and the vitest suite stay green

## Notes (owner appends)
- The `masjid_id`-first signature of every query helper stays — it becomes an
  assertion/guard rather than the sole boundary.
- Watch the handful of legitimately cross-tenant server jobs (continuity briefing
  generation, AI spend rollups, seed/migrate scripts) — those keep the service
  client on purpose.
