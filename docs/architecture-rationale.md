# Architecture rationale — why this shape fits the project

_Task T71. `docs/ARCHITECTURE.md` is the original plan; this is the built system,
made legible, with each major choice justified and the known tradeoffs named.
Decision history is in `docs/decisions.md` — this file is the technical view._

## One picture

```
                         browser
                            │
        ┌───────────────────┼────────────────────┐
        │            proxy.ts (Next 16)          │  refresh Supabase session,
        │   redirect unauth → /login             │  bounce off /admin /parent /student
        └───────────────────┼────────────────────┘
                            ▼
  ┌──────────────────────────────────────────────────────────────┐
  │  Next.js 16 app (App Router) — one deployment                 │
  │                                                              │
  │  app/(admin|parent|student)/…    server components + layouts  │
  │      layout → requireRole("…")  ◄── the role gate             │
  │  app/*/actions.ts               "use server", re-check role   │
  │  app/api/*/route.ts             AI generate/grade endpoints   │
  │  app/login, app/signup          real Supabase Auth            │
  │                                                              │
  │  lib/auth      session → users row (auth_id) → SessionUser    │
  │  lib/ai/*      ALL model calls (client.ts: 90s timeout,       │
  │               fallback-*.ts hand-authored safety net)         │
  │  lib/db/*-queries.ts   every fn takes masjidId FIRST and      │
  │               checks it  ◄── the tenant boundary (app code)   │
  │  lib/compliance/*   pure status engine (unit-tested)          │
  └───────┬───────────────────────────────────┬──────────────────┘
          │ service-role client (bypasses RLS)│ messages.parse (structured output)
          ▼                                   ▼
   ┌─────────────┐                     ┌──────────────┐
   │  Supabase   │  Postgres + Auth    │  Anthropic   │  Claude Sonnet 5
   │  (us-west-2 │  every table has    │  API         │  lesson / checkpoint /
   │   → T39)    │  masjid_id          │              │  assessment / exam / briefing
   └─────────────┘                     └──────────────┘
```

**Where tenancy is enforced:** by **Postgres RLS** (T31 + T79) for anything on a
signed-in user's request path, with the **application-code `masjidId` filter** as
a redundant guard on top. Every `lib/db/*-queries.ts` function still takes
`masjidId` as its first argument (sourced from the session, never the request).

- **RLS (the DB boundary).** RLS is enabled on every table. A per-table SELECT
  policy (T31) and INSERT/UPDATE/DELETE policies (T79) scope rows to
  `public.app_masjid_id()` — the caller's masjid, resolved from `auth.uid()` via a
  `SECURITY DEFINER` helper — directly on `masjid_id` or by joining up through the
  owning student / pod / course. Writes to admin-owned tables additionally require
  `app_role() = 'admin'`; result rows can be inserted by the student they belong
  to or an admin; `audit_log` / `model_call_log` / `consent_records` have no
  authed-write policy at all (append-only triggers + service-role only).
  `npm run check:rls` proves it: anon sees nothing; a signed-in parent sees only
  their masjid and cannot read *or write* across the tenant line, even after a
  second masjid is inserted behind their back.
- **Which reads run under RLS today.** `lib/db/parent-queries.ts` and
  `lib/db/analytics-queries.ts` read through `getReadClient()` — the RLS-enforced
  authed client for a real session, service-role for the "try the demo"
  dev-role-cookie path (where there is no `auth.uid()` and RLS would blank the
  page). The remaining `lib/db/*-queries.ts` files and all writes still use the
  service-role client; **T79** tracks moving them and is the boundary between
  "RLS is a safety net" and "RLS is the only thing standing between tenants".
- **Legitimately cross-tenant server work** — seed/migrate scripts, continuity
  briefing generation, AI spend rollups — keeps the service-role client on
  purpose.

## Why this shape (choice → alternative rejected → reason)

| Choice | Rejected alternative | Why |
|---|---|---|
| **One Next.js app**, three route groups | Three separate apps / a SPA + separate API | The dashboards differ in UI and permissions, not in system. One app = one deploy, one auth, one schema, far less to audit under time pressure. |
| **Supabase** (Postgres + Auth + storage) | Roll our own Postgres + auth; Firebase | One managed service covers DB, auth, row storage, and PITR backups. Postgres (not a document store) because the data is relational — pods, students, results, courses all join. |
| **Anthropic API direct from `lib/ai/`**, no separate service | A Python microservice for AI/grading | There's no ML: the AI work is ~6 prompt templates + `messages.parse` structured output. Grading is deterministic TypeScript. A second service would add deployment, a network hop, and nothing else. |
| **No vector DB / RAG** | Embeddings + retrieval over a curriculum corpus | We generate content from a short course/node prompt, not retrieve it. There's no corpus to search. If a real curriculum corpus becomes core, revisit. |
| **Persist generated content** on the row; never regenerate on view | Generate on demand each visit | Continuity (a pod + its handoff briefing need stable content) **and** economics (turns AI into a one-time ~$0.58/unit/masjid cost — the fact the funding model rests on). See `docs/cost-model.md`. |
| **`messages.parse` + Zod schemas** for every generation | Free-text prompting + parsing | The output feeds the DB and the UI directly; a schema-validated shape removes a class of parse bugs. `lib/ai/questions.ts` owns the question schema once for checkpoints, assessments, and exams. |
| **`masjid_id` on every table** from day one | Single-tenant now, refactor later | Near-zero cost up front; avoids a schema rewrite when "any masjid can run this" gets questioned; forced us to get isolation right early. |
| **Objective grading in code**, not the model | LLM-graded responses | Reliability for a compliance artifact + removes "the AI graded my kid wrong" risk. PRD non-goal. |
| **Route-group layouts as the auth gate** (`requireRole`) + `proxy.ts` as a fast pre-check | A permissions matrix / middleware-only auth | Three roles, one tenant scope — a matrix is overkill. The layout guard is the real check (it can read the DB); `proxy.ts` is an optimistic redirect so unauth users don't render a dashboard shell. |
| **`lib/db/*-queries.ts` split by feature** | One big `queries.ts`; an ORM | Keeps each feature's data access reviewable in one file and let multiple people work in parallel without collisions. An ORM adds a layer over queries that are already simple. |
| **Vercel** hosting | Self-host / containers | Zero-config for Next.js, preview deploys per PR (T54), and it scales to many masjids on one project. Canadian function region is a config change (T39/T27). |

## Known tradeoffs (and the task that closes each)

| Tradeoff | Risk | Fixed by |
|---|---|---|
| Most `lib/db/*` still uses the **service-role** client → RLS is a safety net there, not the live boundary | A missing `masjid_id` filter in one of those queries = a cross-tenant leak (the audit found one, now fixed) | **T31** — RLS + SELECT policies on every table. **T79** — write policies on every table + `parent-queries` / `analytics-queries` reads moved to the RLS-enforced `getReadClient()`; `npm run check:rls` proves cross-tenant reads *and* writes are refused. Moving the rest of `lib/db/*` off service-role is the remainder of T79. |
| **Auth** was a dev cookie through the build; real Supabase Auth landed late (T30) so **RLS couldn't land in the same pass** | Short window where auth and tenancy weren't co-designed | T30 (done) → **T31** |
| **DB in AWS us-west-2 (US)**, not Canada | Not acceptable for a Quebec pilot with minors' data | **T39** — migration plan to `ca-central-1` |
| One **cross-border AI call** sends child first names + progress to Anthropic (the continuity briefing) | Personal info about minors leaving Quebec without a PIA | **T39** (pseudonymise before the call) + **T36** (Law 25 PIA) |
| Some `lib/db/*` reads do **N+1 round-trips** (per-pod, per-course loops) | Slow dashboards at scale | **T73** — batch the worst loops |
| **~8% line coverage** of `lib/` (the DB glue is untested; the pure logic is ~98–100%) | A query-layer regression could ship silently | **T54** — CI + a Postgres integration harness |
| Ledger, vetting, payments, sponsorship mapping are **mocked** | Not a real product yet | Documented in `docs/scope.md`; each has a roadmap task (T14 real rail, T15+, T21) |

## What this architecture is *not*

No microservices, no message queue, no vector DB, no separate Python service, no
GraphQL/tRPC, no container orchestration, no client-side data store. Every one of
those was considered and rejected as weight the project's scale doesn't justify —
Next + Supabase + Anthropic on Vercel carries many masjids. See
`docs/decisions.md` #9.
