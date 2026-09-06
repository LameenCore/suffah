# Suffa

> Community-run homeschool pods where the software carries the curriculum, so
> learning doesn't stop when a volunteer leaves — funded by the community, not
> tuition.

**Challenge track:** At-Home Education

**Elevator pitch:** Quebec Muslim families run small homeschool pods at the
masjid to share cost and give kids company. The pods keep breaking on volunteer
churn — when the volunteer teaching Grade 6 math moves away, instruction stops.
Suffa puts an AI in the teacher's seat for lessons, checkpoints and exams so
instruction never stops, keeps volunteers for the in-person enrichment, turns a
volunteer's departure into a briefed handoff instead of an outage, and assembles
the Quebec home-instruction compliance record automatically. It's sustained by a
waqf endowment plus a small flat fee, not tuition — so it's viable from the very
first family.

---

## Inspiration

Suffa is named for the *Ashab al-Suffa* — the "People of the Platform," companions
of the Prophet Muhammad ﷺ who lived at the mosque in Medina and were sustained by
the community so they could devote themselves entirely to learning. The funding
model deliberately mirrors that precedent.

The concrete problem: Muslim families in Quebec who want to homeschool face a
four-way trade-off with no good corner — **quality** (one parent can't teach every
subject), **cost** (private Islamic school runs ~$8–15K per child per year and is
tuition-dependent), **compliance** (Quebec requires a learning project and periodic
evaluation), and **socialisation** (homeschooling alone is isolating).

Community-run **pods** — a few families, a shared room at the masjid, a rotating
volunteer teacher — solve cost and socialisation. But they live and die by their
volunteers. When the one teaching a subject leaves, teaching in that subject stops
until someone else ramps up, and the thread of *how that group was learning* is
lost. High volunteer churn is the single operational failure mode we set out to
fix.

## What it does

Suffa is one Next.js app with three dashboards over a shared data model:

- **Student playground** — a self-paced curriculum surface. The AI delivers the
  actual instruction: a lesson, then an objective checkpoint that gates
  progression, then a unit assessment, then a timed term exam. A grounded AI
  tutor answers questions about the current lesson only, and refuses to hand over
  checkpoint answers.
- **Parent dashboard** — read-only. Every checkpoint / assessment / exam result
  appears the moment the child finishes it, alongside a live "on track / watch /
  gap forming" evaluation status per course, so there are no term-end surprises.
- **Masjid admin dashboard** — pod assignment (hard cap of 4 students, matching
  Quebec's home-instruction exemption threshold), volunteer onboarding and churn
  log, the **Continuity Fingerprint** (an AI briefing that tells the incoming
  volunteer *how* a pod has been learning — where it got stuck, who needed extra
  attempts, what the session notes say), the **living compliance report** (an
  early-warning record assembled continuously from real results, with a snapshot
  and printable view), and a **waqf ledger** that shows the endowment principal
  locked and untouched with a donation traced to a pod's actual unit completion.

The core loop we built end to end, across three courses (Math → maps to the
Quebec Secondary 1 program; Seerah → community-authored, no external vendor; AI
literacy → the meta-narrative), one full unit each:

1. A **student** finishes a lesson, passes the checkpoint, and the pod advances.
2. The **parent** sees the result and the updated evaluation status immediately.
3. An **admin** takes a volunteer offline mid-session — the playground keeps
   running — assigns a replacement, and the Continuity Fingerprint briefing
   generates on screen.
4. The **admin** opens the living compliance report: one student "gap forming,"
   another "on track," each backed by the actual evidence; snapshot + printable.
5. The **admin** opens the waqf ledger: principal never touched, only the ~4%
   annual return drawn, and one contribution linked to the unit it funded.

Everything AI-generated — lessons, checkpoints, assessments, exams, briefings —
can also be produced in **Quebec French**, and the entire UI switches EN ⇄ FR
from one control.

## How we built it

- **Next.js 16** (App Router, TypeScript, Tailwind v4). Three route groups
  (`/student`, `/parent`, `/admin`) over shared components; a `proxy.ts` route
  guard; role-based auth scoped per masjid, multi-tenant from day one.
- **Supabase** — Postgres + Auth. **Row-level security on all 32 tables** with
  `SECURITY DEFINER` helpers, per-table SELECT/INSERT/UPDATE/DELETE policies, and
  a standalone `check:rls` script that proves cross-tenant reads *and* writes are
  refused at the database, not just in app code. Append-only triggers on the
  audit and consent tables.
- **Anthropic API (Claude Sonnet 5)** for every generative surface: lesson,
  checkpoint, unit-assessment and term-exam generation, the grounded lesson
  tutor, and the volunteer handoff briefing. Structured output via Zod schemas.
  **Grading is done in code, never by a rubric model** — every question format is
  objective (MCQ, short numeric / short answer), which keeps grading free and
  deterministic (a hard PRD non-goal to avoid rubric grading).
- **Content is generated once and persisted**, never regenerated on view — a
  pod's continuity depends on stable, referenceable content. That's also why the
  unit economics work: ~$0.30 of one-time model spend per curriculum unit per
  masjid, ~$0.02 per handoff briefing, and ≈$0 to add another student.
- **i18n** — a hand-rolled EN/FR framework (the app has no locale-prefixed
  routes and the catalogues are small), 1087 message keys with a CI check that
  fails on any EN/FR mismatch, `fr-CA` date/number/currency formatting, and a
  migration that adds `*_content_fr` columns so French generated content
  co-exists with English without touching it.
- **PWA + offline** — download the current unit, work through the lesson and
  checkpoint offline, sync on reconnect.
- **Accessibility** — a WCAG 2.2 AA pass with an automated axe gate in CI
  (`check:a11y`) reporting no serious/critical violations, jsx-a11y rules
  promoted to errors, a focus-trapped mobile drawer, and a cognitive-load
  "simple view."
- **CI** runs lint + typecheck + build + 68 Vitest tests + the i18n check + the
  a11y gate on every push. Also in the repo: a data-integrity check, a
  backup/restore runbook, AI-spend metering with budget alerts, and a
  concurrency-safe multi-agent progress tracker under `progress/`.
- **Demo delivery** — `python scripts/demo.py` builds, starts the server, opens
  an ephemeral Cloudflare quick tunnel, and prints a shareable URL; Ctrl+C tears
  it all down.

## Challenges we ran into

- **Grading without a rubric model.** Keeping every assessment format objective
  so it grades in code — and designing the generation prompts so the model only
  ever produces checkable questions — took several iterations, but it's what
  makes the cost model real.
- **Row-level security that's actually provable.** Getting `SECURITY DEFINER`
  helpers, per-role write policies, and append-only triggers to coexist with
  tenant/cascade deletes — and writing a script that *demonstrates* isolation
  against a live second tenant — was more involved than expected.
- **French without breaking the demo.** The demo runs in English; French had to
  be additive. We externalised 1087 UI strings, then threaded a `locale` through
  every AI generator and grader and added `*_content_fr` columns so a French
  lesson is generated on demand and stored alongside the English one, which stays
  byte-identical.
- **Continuity as a first-class feature, not a footnote.** Making the handoff
  briefing genuinely useful — grounded in a pod's checkpoint history, remediation
  events and session notes rather than a generic summary — is the thing the whole
  pitch rests on.
- **Keeping `main` green across parallel work** with a hand-rolled,
  concurrency-safe task tracker so multiple agents/sessions could build without
  colliding.

## Accomplishments that we're proud of

- The **full core loop works end to end** — lesson → checkpoint → assessment →
  term exam → auto-assembled compliance report — across three real courses.
- **Database-enforced multi-tenant isolation** with an automated proof, not just
  app-layer checks.
- **The whole product is bilingual** — every screen, and the AI-generated content
  too — switchable from one control, with a CI check that keeps the catalogues in
  sync.
- A **defensible business model, not just a demo**: content generated once,
  marginal cost of a student ≈ zero, viable from the first family, funded by a
  waqf drive masjids already know how to run.
- Green on lint, typecheck, build, 68 tests, i18n parity, data integrity, RLS
  isolation, and an automated accessibility gate.

## What we learned

- When grading is objective and content is generated once, an "AI-taught"
  curriculum is genuinely cheap to run — the cost is a one-time content cost per
  masjid, not a per-seat cost. That reframes what a community can afford.
- Volunteer churn is better modelled as a **knowledge-transfer problem** than a
  staffing problem. Briefing the next person on *how the group learns* is a
  small feature with outsized leverage.
- Compliance is far more useful as a **live early-warning view** than as a
  term-end artifact — the same data, surfaced continuously, changes what a family
  can do about a gap.
- Building multi-tenant and RLS-first from commit one is much cheaper than
  retrofitting them.

## What's next for Suffa

- **Pilot partnership** with 3–5 Greater-Montreal masjids: one pod each for a
  term, a modest founding waqf per masjid, measuring completion, family
  retention, volunteer-churn resilience, and cost per active student against the
  model.
- Real payment rails and background-check integration (both mocked for the
  hackathon), Canadian data residency, and a full Quebec Law 25 pass.
- Native Quebec-French review of the localisation, and French generated content
  wired through the remaining surfaces (handoff briefing, remediation).
- Broaden past one unit per course toward full-year curriculum coverage, and
  onboard a second masjid end to end to exercise the per-masjid content library.

## Built With

next.js, typescript, react, tailwindcss, supabase, postgresql, row-level-security,
anthropic, claude, zod, vitest, node.js, pwa, service-workers, web-accessibility,
i18n, vercel, cloudflare-tunnel

## Try it out

- **Repo:** `github.com/LameenCore/suffah`
- **Run the demo:** `python scripts/demo.py` — prints a shareable URL. Then open
  `/login` → "Explore the demo" → pick Admin, Family, or Student. Toggle EN ⇄ FR
  from the control in the sidebar.
