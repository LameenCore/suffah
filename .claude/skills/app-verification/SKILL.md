---
name: app-verification
description: >-
  Prove a change actually works in the running app, not just that it type-checks.
  Build → lint → typecheck, then (if the DB is configured) migrate + seed +
  generate content, start the dev server, hit the affected routes with the right
  role cookie, and confirm real data renders with no error panels. Use after a
  feature or fix that touches routes, queries, actions, or the schema, and
  whenever the user asks to verify / run / screenshot the app.
---

# App verification — Suffa

"It builds" is not "it works". This skill is the ladder from one to the other.
Climb only as far as the change needs.

## Rung 1 — static (always)

```
npx next build      # includes the real TypeScript check (bare `tsc` misses Next's generated types)
npx eslint .
```

Both must be clean. `next build` also prints the route list — confirm new routes
appear as `ƒ` (dynamic) or `○` (static) and nothing 500s during static
generation.

## Rung 2 — data layer (change touches queries / actions / schema)

Needs `.env.local` with the Supabase keys + `SUPABASE_DB_URL`. If it is absent,
stop here and say so — do not claim runtime verification you did not do.

```
npm run migrate        # applies supabase/migrations/*.sql in order, idempotent
npm run seed           # wipes + reseeds the demo masjid (idempotent)
npm run seed:continuity && npm run seed:progress
npm run gen:lessons && npm run gen:checkpoints && npm run gen:assessments && npm run gen:exams
```

Then exercise the changed query/action functions directly with a throwaway
`tsx --env-file=.env.local` script (import from `@/lib/...`, assert on the
results, print ✓/✗). Delete the script afterwards — never commit it.

## Rung 3 — rendered pages (change touches routes / components)

```
npm run dev &                 # background; wait for http://localhost:3000 to 200
```

For each affected route, `curl` with the dev-role cookie and check:

```
curl -s -o /tmp/p.html -w "%{http_code}" \
  -H "Cookie: suffa-dev-role=admin" http://localhost:3000/admin/pods
grep -c "is unavailable\|could not load\|Application error" /tmp/p.html   # must be 0
```

Then grep the HTML for 2–3 concrete strings that only appear when real data
rendered (a seeded name, a computed number, a badge) — not just HTTP 200, which
an error boundary also returns. Roles: `admin`, `parent`, `student`.

Stop the dev server when done.

## Rung 4 — interaction (mutations / multi-step flows)

Use the `claude-in-chrome` tools (or a scripted action call) to drive the actual
flow: submit the form, click the button, confirm the row changed and the UI
reflects it. Reset demo state afterwards (`npm run seed` + the gen scripts).

## Reporting

State exactly which rungs ran and what each showed. If a rung was skipped (no
`.env.local`, no browser), say which and why. "Verified" with no detail is not a
report. Faithfully report failures with the output that showed them.
