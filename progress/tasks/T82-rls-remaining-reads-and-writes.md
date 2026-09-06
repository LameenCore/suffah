---
id: T82
title: RLS — remaining reads (newer query files) + move user-action writes off service-role
phase: 9
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-06T02:00:00Z
updated: 2026-09-06
completed: 2026-09-06T00:00:00Z
outcome: >
  Reads in authoring / skill-tree / question-bank / attendance / path -queries
  migrated to getReadClient() (read/write-aware pass; writes stay on service-role).
  migration 0025_rls_parent_scope: the student-record SELECT policies
  (checkpoint/unit/term results, lesson_progress, compliance_reports, review_items,
  path_events, node_remediations, tutor_messages) + parent_children + consent_records
  now additionally require, when app_role()='parent', that the row's student is
  linked to the caller in parent_children — a parent can no longer read other
  families' records even via a raw authed query. check-rls extended + passes 16/16
  incl. "parent sees checkpoint_results for their linked children ONLY". build +
  68 tests + check:integrity green; dev dashboards + student/exam/authoring all 200.
  **The writes axis (move user-action .insert/.update/.delete off service-role) is
  split to T83** — it needs a per-route logged-in browser pass that this session's
  flaky screenshot tooling can't do reliably.
commits: 7a92492
depends_on: [T80]
source: split from T80 (its out-of-scope files + the writes axis)
---

## Why
T80 moved the 13 originally-named read files onto `getReadClient()`. Query files
that landed *after* T80 was written weren't in scope, and **all writes** across
the app still run on the service-role client (RLS write policies from
`0017_rls_write_policies.sql` are a safety net there, not the live boundary).

## Done when
- [x] Reads in the 5 newer query files -> getReadClient() (writes stay on service-role)
      through `getReadClient()` (writes stay on `getServiceClient()`)
- [~] User-action `.insert()/.update()/.delete()` calls (a signed-in user changing
      their own tenant's data via a server action) move to the authed client so
      `0017`'s write policies are the live check; genuine system writes (seed,
      briefing generation, spend logging, audit log) stay explicit on service-role
- [~] `check-rls.ts` already asserts cross-tenant write refusal for checkpoint_results + waqf_ledger (from T79); per-call-site coverage is part of T83
- [~] Per-route browser click-through as a logged-in user for each role (the
      verification T80 could not finish without a browser)
- [x] `parent` SELECT policies tightened to relationship-scope — migration 0025
- [x] `check:rls` (16/16), `check:integrity`, vitest (68), `next build` green

## Notes (owner appends)
- `getReadClient()` already self-heals to service-role outside a request context,
  so migrating a read is low-risk. Writes are higher-risk — do them with the
  browser click-through, not blind.
