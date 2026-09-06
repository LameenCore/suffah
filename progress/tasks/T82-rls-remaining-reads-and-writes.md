---
id: T82
title: RLS — remaining reads (newer query files) + move user-action writes off service-role
phase: 9
status: todo
owner: —
claimed: —
updated: 2026-09-06
depends_on: [T80]
source: split from T80 (its out-of-scope files + the writes axis)
---

## Why
T80 moved the 13 originally-named read files onto `getReadClient()`. Query files
that landed *after* T80 was written weren't in scope, and **all writes** across
the app still run on the service-role client (RLS write policies from
`0017_rls_write_policies.sql` are a safety net there, not the live boundary).

## Done when
- [ ] Reads in `authoring-queries.ts`, `skill-tree-queries.ts`,
      `question-bank-queries.ts`, `attendance-queries.ts`, `path-queries.ts` run
      through `getReadClient()` (writes stay on `getServiceClient()`)
- [ ] User-action `.insert()/.update()/.delete()` calls (a signed-in user changing
      their own tenant's data via a server action) move to the authed client so
      `0017`'s write policies are the live check; genuine system writes (seed,
      briefing generation, spend logging, audit log) stay explicit on service-role
- [ ] `scripts/check-rls.ts` extended with a cross-tenant **write via the app path**
      refusal for each moved call site's table
- [ ] Per-route browser click-through as a logged-in user for each role (the
      verification T80 could not finish without a browser)
- [ ] Consider tightening `parent` SELECT policies from masjid-scope to
      relationship-scope (`parent_children`)
- [ ] `check:rls`, `check:integrity`, vitest, `next build` green

## Notes (owner appends)
- `getReadClient()` already self-heals to service-role outside a request context,
  so migrating a read is low-risk. Writes are higher-risk — do them with the
  browser click-through, not blind.
