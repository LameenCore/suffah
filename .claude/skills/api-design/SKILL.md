---
name: api-design
description: >-
  Conventions for anything under app/api/ and for Server Actions in this repo —
  route shape, tenant (masjid_id) scoping, role checks at the handler, persisting
  AI output before returning it, status codes, and what not to build. Use when
  adding or reviewing a route handler or a "use server" action, or when the user
  asks for an API review.
---

# API design — Suffa

Applies to every file under `app/api/` and every `"use server"` action file
(`app/**/actions.ts`). Supersedes the older `api-design.md` at repo root.

## The five rules

1. **Tenant scoping is not optional.** Every read and write filters by
   `masjid_id`, taken from the authenticated session — never from the request
   body, query string, or a route param. A caller must not be able to reach
   another masjid's rows by changing an id. Prefer routing DB access through
   `lib/db/*-queries.ts` helpers that take `masjidId` as their first argument and
   check it before returning or writing.
2. **Authorise at the handler, not just the UI.** Re-resolve the session
   (`getCurrentUser` / `requireRole`) inside every route and every Server Action.
   A Server Action is a public POST endpoint — treat it like one. Check the role
   the action actually needs (student vs parent vs admin), and return 401 for "no
   session", 403 for "wrong role".
3. **Persist AI output before responding.** Generation endpoints
   (`/api/*/generate`, revision, briefing) write the result to the DB and then
   return the persisted row — never stream raw model output straight to the
   client. Continuity depends on stable, referenceable content (see
   ARCHITECTURE.md). If content already exists, return it as-is unless `force`.
4. **Every AI call has a fallback.** A model timeout must not break a live demo.
   Catch failures and fall back to the hand-authored content in
   `lib/ai/fallback-*.ts`; label the response `source: "fallback"`.
5. **Flat, predictable response shapes.** `Response.json({ ... })` with a small
   fixed set of top-level keys. Errors are `{ error: string }` with a real status
   code. Keep the same shape across sibling routes — consistency over cleverness.

## Route conventions

- Resource-based paths: `/api/pods`, `/api/pods/[id]`. RPC-style is allowed only
  for inherently-action endpoints — the AI calls (`/api/lessons/generate`,
  `/api/checkpoints/grade`).
- `POST` for mutations and generation; `GET` only for reads. Parse the body in a
  `try/catch` and return 400 on malformed JSON.
- Validate every input field: presence, type, and (for ids) that the row exists
  in the caller's masjid. Reject unknown enum values explicitly.
- Error messages are generic about what exists ("not found", not "student
  00000... has no pod"). No student PII in error text or `console.error`.

## Server Action conventions

- File starts with `"use server"`. First line of every export re-checks the
  session + role.
- Return a small result object for anything the UI must react to:
  `{ ok: true } | { ok: false, error: string }`. Do not throw across the action
  boundary for expected failures (capacity hit, wrong role) — throwing shows the
  Next error overlay in dev and a blank failure in prod.
- Call `revalidatePath()` for every path whose data changed (often more than
  one). Use `revalidatePath(path, "layout")` when nested routes read the data.

## What not to build (hackathon scope)

- No API versioning, no rate limiting, no pagination beyond a `limit` arg.
- No GraphQL / tRPC. Plain route handlers.
- No generic middleware auth layer — explicit checks per handler are easier to
  audit under time pressure.

## Review checklist

- [ ] `masjid_id` filter on every query, sourced from the session
- [ ] Role checked in the handler/action, correct status codes
- [ ] Ids from the request are verified to belong to the caller's masjid
- [ ] AI output persisted before return; `force` respected; fallback on failure
- [ ] Body parsing guarded; all inputs validated; enums whitelisted
- [ ] Error text generic; no PII in logs
- [ ] Response shape matches sibling routes
- [ ] Server Action returns `{ok,error}`, re-checks auth, revalidates all changed paths
