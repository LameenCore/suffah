---
id: T31
title: Postgres RLS policies per table
phase: 9
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-06T06:45:00Z
updated: 2026-09-05
completed: 2026-09-05T00:00:00Z
outcome: >
  migration 0016_rls_policies.sql: SECURITY DEFINER helpers app_masjid_id() /
  app_role() resolve auth.uid() -> the caller's masjid (definer so they don't
  recurse through users' own RLS); RLS ENABLED on all 32 app tables (explicit
  allowlist, schema_migrations left alone); a per-table SELECT policy scoping rows
  to app_masjid_id() — direct on masjid_id (13 tables), or via a join up through
  student_user_id -> users (11), pod_id -> pods (3), course_id -> courses (3), or
  node_id -> pathway_nodes -> courses (lesson_contributions). service_role keeps
  BYPASSRLS so the app is unchanged. scripts/check-rls.ts + `npm run check:rls`:
  13 assertions — anon-no-auth sees 0 rows everywhere; a signed-in parent sees
  only their masjid and CANNOT see a second masjid inserted behind their back;
  in-tenant reads still work. Verified live; check:integrity + 62 tests + build
  green; login/signup/dashboards confirmed working post-RLS (they use service-role
  for data; the one authed users-row lookup in getCurrentUser/signInAction reads
  the caller's own row, which the policy allows).
commits: d555124
depends_on: [T30]
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
All server DB access uses the service-role client, so the application-code  `masjid_id`
filter is currently the ONLY tenant boundary (flagged in  docs/review/2026-09-05-audit.md).
RLS is defense in depth.

## Done when
- [x] RLS enabled on every table; policies scope rows by masjid_id / ownership via the auth
      JWT — `0016_rls_policies.sql`, SELECT policies keyed to `app_masjid_id()`
- [~] Server code moved to the anon/authed client where it suffices — **deferred to T79**
      (a real refactor of every `lib/db/*-queries.ts`, needs sign-off; the app stays
      correct on service-role in the meantime). WRITE policies land with that change.
- [x] A test proving a cross-tenant read is refused at the DB — `npm run check:rls`

## Notes (owner appends)
- The reads path is the leak vector the audit actually found (a missing `masjid_id`
  filter on a cross-tenant *read*). RLS SELECT policies + `check:rls` close that at
  the DB. Writes never go through a non-service client today, so with no write
  policy they are deny-by-default for anon/authenticated — safe direction.
- Split off **T79** for the authed-client migration + write policies.
- `docs/architecture-rationale.md` updated (the "where tenancy is enforced" para +
  the tradeoffs table row).
