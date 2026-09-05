---
name: security-review
description: >-
  Security pass for this repo — a product concept involving minors' data. Checks
  tenant isolation (masjid_id), role gating on every route and Server Action,
  injection through PostgREST filter strings, secret handling, the service-role
  client's blast radius, error/log disclosure, and input validation. Use before
  merging anything that touches auth, queries, actions, routes, or the schema,
  and whenever the user asks for a security review.
---

# Security review — Suffa

This project models data about children aged 10–13 and their guardians. Access
control and data scoping are first-class here — not for demo-day regulatory
pressure, but because it is the responsible default and a question judges will
ask. Supersedes the older `security-review.md` at repo root.

## 1. Tenant isolation (`masjid_id`)

- Every DB read and write filters by `masjid_id`. Trace each query in the diff to
  where its `masjid_id` comes from — it MUST be the authenticated session's, never
  a request body / query param / route param.
- Embedded-relation filters (`pods!inner ( ..., masjid_id )`) must be followed by
  an explicit check on the returned value — PostgREST `!inner` does not guarantee
  the parent row matched your intent.
- ID-in-URL test: for every route/action that takes an id, confirm a caller from
  masjid A cannot act on masjid B's row by supplying its id. `get*` helpers that
  return `null` for cross-tenant ids are the pattern; verify writes reuse them.

## 2. AuthZ on every entry point

- Route handlers: `getCurrentUser` / `requireRole` at the top; 401 vs 403
  distinct; the role checked is the least one required.
- Server Actions are unauthenticated POST endpoints until proven otherwise —
  every export re-checks session + role on its first line. A shared `requireX()`
  helper is fine; an action that trusts a prop or hidden field is not.
- Parent role: a parent may read only children linked via `parent_children`.
  Confirm `getChildrenForParent` gates every parent-facing read.

## 3. Injection

- **PostgREST filter strings**: `.or("a.eq." + x + ",b.eq." + y)` and
  `.filter(col, "op", x)` interpolate `x` into a query string. Only pass values
  the app generated (UUIDs from the session/DB). Never interpolate free text,
  form input, or a search term — use `.eq()` / `.in()` with parameters, or
  validate against `^[0-9a-f-]{36}$` first. Flag every `.or(` / string-built
  filter in the diff.
- Raw SQL only in `scripts/migrate.ts` (static files) and `scripts/seed.ts`
  (static values). No user data reaches SQL text.
- LLM prompt building: user/DB text goes in as data, not instructions. Persisted
  model output is rendered as text, never `dangerouslySetInnerHTML`.

## 4. Secrets

- `SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` are server-only. Confirm
  they are never imported into a `"use client"` file and never sent to the
  browser. Only `NEXT_PUBLIC_*` may cross to the client.
- `.env*` is git-ignored except `.env.example`; `.env.example` holds no real
  values. Grep the diff for anything shaped like a JWT / `sk-ant-` / a Postgres
  URL with a password.

## 5. Service-role client blast radius

- `getServiceClient()` bypasses RLS. It is legitimate in server code, but it
  means the `masjid_id` filter in application code is the ONLY thing standing
  between a bug and a cross-tenant leak. Every new `getServiceClient()` call site
  gets extra scrutiny on its filters.
- `getServerClient()` (anon key, RLS-bound) is preferable where it suffices.

## 6. Disclosure

- Error responses and `console.error` say "not found" / "not permitted", never
  which rows exist or a student's name/email. Check `catch` blocks that echo
  `err.message` to the client — DB errors can carry row data.
- No student PII in client bundles, URLs, or logs.

## 7. Input validation

- Presence + type + range on every field of every body / FormData. Enums checked
  against an allow-list. Numbers bounded. Strings length-capped before insert.
- `revalidatePath` / `redirect` targets are static literals, not built from
  input.

## Output

Report findings most-severe first: file:line, what an attacker/buggy caller does,
the concrete consequence, the fix. Separate "real issue" from "demo-scope
accepted risk" (mock vetting, mock ledger, dev-cookie auth) — the latter are
documented limitations, not findings, but must not be contradicted by UI copy.
