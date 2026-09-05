# Data map & residency

_Date: 2026-09-05 · Task T39 · Companion to `docs/compliance/quebec-home-instruction.md`
and the Law 25 baseline (T36). **Not legal advice** — a Quebec pilot needs a
privacy impact assessment (évaluation des facteurs relatifs à la vie privée)
before any personal information about a child leaves Quebec._

## TL;DR

- **Today the data is in the US** (Supabase project in AWS `us-west-2`), which is
  fine for a hackathon demo and **not** acceptable for a Quebec pilot with real
  families.
- **Target: everything at rest in `ca-central-1`** (Supabase Canada, Vercel
  Canada region), with **one deliberate cross-border flow** — the Anthropic API
  call — minimised and covered by a PIA.
- The migration is "create a new Supabase project in `ca-central-1`, re-run the
  migrations, move the data" — cheap while the dataset is one demo masjid,
  cheaper the sooner it happens.

## Current state (as built)

| Layer | Provider | Region | Notes |
|---|---|---|---|
| App / compute | local `next dev` only; Vercel planned (T27) | — | no production host yet |
| Database, Auth, Storage | **Supabase (Postgres)** | **AWS `us-west-2`** (Oregon) | confirmed from the pooler host `aws-0-us-west-2.pooler.supabase.com` |
| LLM processing | **Anthropic API** (Claude Sonnet 5) | US | lesson / checkpoint / assessment / exam generation, continuity briefings, lesson revision |
| Email | none | — | transactional email is T58 |
| Analytics | none | — | deliberate — no third-party tracker on a minors' product |
| Client storage | the browser | — | one cookie, `suffa-dev-role`; no `localStorage` PII |

## Data inventory

Every category, where it lives, and whether it is personal information about a
minor (PIM) under Law 25.

| Category | Tables | Store | PIM? | Sent to Anthropic? |
|---|---|---|---|---|
| Masjid / tenant | `masjids` | Supabase | no | no |
| People | `users` (name, email, role), `volunteers` (name, cert note) | Supabase | **yes** (students, parents) | no |
| Family link | `parent_children` | Supabase | **yes** (relationship) | no |
| Pods | `pods`, `pod_students`, `pod_progress` | Supabase | **yes** (which child in which pod) | pod-level only, in briefings |
| Curriculum | `courses`, `units`, `pathway_nodes`, `term_exams` | Supabase | no | **yes** — node titles + course context to *generate* content; the generated `lesson_content` / `checkpoint_content` is stored back |
| Results (per student) | `checkpoint_results`, `unit_assessment_results`, `term_exam_results`, `lesson_progress` | Supabase | **yes** (a child's academic performance) | **indirectly** — aggregate pass counts + "a student has missed X twice" phrasing feed the briefing prompt |
| Compliance | `compliance_reports` (`report_data` jsonb) | Supabase | **yes** (assembled academic record) | no |
| Continuity | `pod_session_notes`, `pod_briefings`, `lesson_contributions` | Supabase | **yes** — session notes may name a child ("Idris was quiet Thursday") | **yes** — session notes + progress signals are the briefing prompt; the model output is stored as `pod_briefings` |
| Community | `pod_barakah_log` (observations, may name a child) | Supabase | **yes** | no |
| Funding | `waqf_ledger`, `family_fee_status`, `sponsorships` | Supabase | `family_fee_status` links a child id to "scholarship_covered" — **yes** | no |
| Auth session | Supabase Auth (after T30); today a dev cookie | Supabase / browser | **yes** (identifies the user) | no |

## Cross-border flows

**Only one, by design: Canada → US, to the Anthropic API.**

| Flow | What crosses | Frequency | Law 25 handling needed |
|---|---|---|---|
| Content generation (`lib/ai/lesson.ts`, `checkpoint.ts`, `assessment.ts`, `term-exam.ts`, `lesson-revision.ts`) | Course name, node title, grade band, existing lesson text, scholar/elder contribution notes | Once per curriculum unit per masjid (persisted, not re-sent on view) | Near-zero PIM. Contribution notes could name a person — strip or pseudonymise before send. |
| Continuity briefing (`lib/ai/continuity.ts`) | Pod name, per-course status, per-student **first name + pass/fail/attempt counts**, recent session-note text | On a volunteer handoff (rare) | **This is the sensitive one.** Pseudonymise students to "Student A/B/C" in the prompt and map back client-side; or run it only after a PIA + a data-processing agreement with Anthropic; consider a zero-data-retention arrangement. |

Everything else (auth, results storage, compliance assembly, the ledger,
dashboards) is Supabase-only and stays in-region once the project is in
`ca-central-1`.

## Target state for a Quebec pilot

| Layer | Target |
|---|---|
| Database / Auth / Storage | Supabase project in **`ca-central-1`** (Montréal/Toronto AWS). New project — region is fixed at creation. |
| App host | Vercel with the function region set to a **Canadian region** (`iad1` is US — use `cle1`? no; use Vercel's `arn1`? no — Vercel's Canadian option) or self-host on a Canadian provider. Confirm at T27. |
| Email (T58) | A provider that can pin to a Canadian region / offers Canadian data residency. |
| LLM | Anthropic API, US — the one accepted cross-border flow, minimised as above, covered by a PIA + DPA, ideally zero-retention. |
| Backups | Supabase PITR stays in the project's region (`ca-central-1`). See T57. |

## Migration plan (us-west-2 → ca-central-1)

While the data is one demo masjid this is minutes of work; do it before onboarding
any real family.

1. Create a **new Supabase project in `ca-central-1`**.
2. `npm run migrate` against the new project (all `supabase/migrations/*.sql`).
3. `npm run seed` + the `gen:*` scripts to repopulate demo content, **or**
   `pg_dump` the old project and restore into the new one for real data.
4. Swap the four Supabase env vars (URL, anon key, service-role key,
   `SUPABASE_DB_URL`) in every environment.
5. Delete the old `us-west-2` project so no copy of the data remains in the US.
6. Update this file's "current state" table and note the cutover date.

## Minimisation opportunities (do regardless of region)

- **Pseudonymise before the briefing call** — the single highest-value change;
  removes children's names from the only sensitive cross-border flow.
- **Don't store what isn't used** — the schema is already lean (name, email, role,
  pod, results); keep resisting speculative fields (address, phone, DOB) — they'd
  be PIM with no product payoff.
- **Short retention on `pod_session_notes`** — free-text that can name a child;
  define a retention window (e.g. one term past the pod's last activity) as part
  of T36.
- **Anthropic retention** — evaluate a zero-data-retention or short-retention
  arrangement so prompts containing progress signals aren't held.

## Sources / basis

- Supabase project region is fixed at creation and visible in Project Settings →
  General; confirmed here from the connection pooler hostname.
- Law 25 (*Act to modernize legislative provisions as regards the protection of
  personal information*) requires a privacy impact assessment before
  communicating personal information outside Quebec and that the information
  receive protection adequate to Quebec standards — pull the current text and the
  CAI's guidance at review time (ties to T36).
