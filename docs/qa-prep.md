# Judge Q&A prep

_Task T77. Drafted answers to every question in the MuslimHacks follow-up
checklist, grounded in the repo. Keep each answer to ~2-4 sentences out loud.
"Backed by" points at the file/doc a judge can be shown. Team/process answers are
left as prompts — fill them in with what actually happened._

---

## Technical implementation

**Delivery format — mobile, web, CLI?**
Web app. One Next.js 16 (App Router) application with three role-scoped dashboard
areas — `/admin`, `/parent`, `/student` — sharing one backend. It's
mobile-responsive; a PWA/offline mode is on the roadmap (T61). _Backed by:
`app/` route groups, `README.md` → Layout._

**What technologies, APIs, frameworks?**
Next.js 16 + TypeScript + Tailwind on the front; Supabase (Postgres, Auth,
storage) for data; the Anthropic API (Claude Sonnet 5) for generating lessons,
checkpoints, assessments, exams, and the volunteer handoff briefing. Deployed on
Vercel. No other services. _Backed by: `package.json`, `docs/ARCHITECTURE.md`._

**How does the system work behind the scenes?**
A pod is assigned a course pathway. The student opens the playground; the current
node's lesson is pulled (generated once by Claude and persisted, never
regenerated). They complete it, a checkpoint is generated + graded — grading is
deterministic code, not the model — and passing advances the pod. Results flow
into the parent view and a continuously-assembled compliance status. When a
volunteer changes, Claude writes a briefing from the pod's progress + session
notes. _Backed by: `lib/ai/`, `lib/db/`, `docs/ARCHITECTURE.md` → data flow._

**Did you build this from scratch during the hackathon?**
Yes — the app, the schema, the AI pipeline, all three dashboards, and the seven
Phase-7 differentiator features. It's tracked task-by-task in `progress/` with a
commit per task. _Backed by: `progress/tasks/`, `git log`._

**Technical tradeoffs made for time?**
(1) Auth is a dev role cookie, not real login — the swap is one file
(`lib/auth`), tracked as T30. (2) All server DB access uses the Supabase
service-role client, so the `masjid_id` filter in app code is the tenant boundary
— RLS is T31. (3) Grading is objective-only (MCQ / short answer) — rubric grading
was a deliberate non-goal. (4) The ledger, volunteer vetting, and payments are
mocked. All are documented, not hidden. _Backed by: `PRD.md` §6,
`docs/review/2026-09-05-audit.md`._

---

## Impact and users

**Target user and how they use it?**
Three: a Quebec Muslim family homeschooling a 10–13-year-old (the parent monitors,
the child learns in the playground); a masjid coordinator (runs pods, volunteers,
compliance); a community volunteer (leads in-person enrichment, not primary
instruction). _Backed by: `PRD.md` §4._

**How would users discover or adopt it?**
Through their masjid — a masjid raises a founding endowment (the same drive they
run for buildings) and opens pods; families join their local pod. Not a
consumer-marketing play. _Backed by: `docs/pitch.md` → The ask._

**How many people could realistically benefit?**
~7,900 homeschooled children in Quebec and ~421,710 Muslims (2021 census),
concentrated in Greater Montreal. A near-term pilot is ~5–10 Montreal masjids,
~4–8 pods each, 3–4 students per pod → ~100–250 students. _Backed by:
`docs/research/model-economics.md`._

**Impact if fully developed?**
Community-run homeschooling that doesn't collapse when a volunteer leaves,
produces a defensible compliance record, and costs a family a low flat fee
instead of $8–15K/year tuition — replicable per masjid. _Backed by:
`docs/pitch.md`._

**How would you measure success?**
Unit/term completion rate, family retention term-over-term, at-risk count trend
(from the living compliance status), volunteer-churn resilience (does learning
continue through a handoff), and AI cost per active student vs the model.
Instrumentation is roadmapped (T64/T65). _Backed by: `docs/roadmap.md` → P13._

---

## Demo & functionality

**Fully functional or mocked?**
The core loop is fully functional against a live database and the real Anthropic
API: lesson → checkpoint → grade → advance, unit assessment, timed term exam, the
parent view, the living compliance report + printable snapshot, the continuity
briefing, the waqf ledger view. Mocked: the ledger *entries* (no payment rail),
volunteer vetting (a status field), donor identity for the sponsorship view, and
auth (dev cookie). _Backed by: `docs/review/2026-09-05-audit.md` → accepted
limitations._

**Most important feature completed?**
The full three-tier loop with objective grading and automatic compliance
assembly — that's the thing the PRD said to prove. The sharpest single feature is
the Continuity Fingerprint: an AI handoff briefing that turns volunteer churn
from data loss into knowledge transfer. _Backed by: `progress/tasks/T18`._

**Hardest part?**
Making the compliance report *forward-looking* — a live "on track / watch / gap"
status assembled continuously from checkpoint + assessment + exam data, with
honest thresholds — rather than a term-end PDF. The status engine is pure and
unit-tested. _Backed by: `lib/compliance/status.ts`, `tests/compliance-status.test.ts`._

**Completed vs prototyped/mocked?**
Completed: 24 build tasks + 7 differentiators, all with tests passing, integrity
checks passing, and 13 routes verified rendering real seeded data. Prototyped as
screens with mock mappings: waqf-to-outcome donor view, Seerah community sourcing.
Mocked data: ledger, vetting, fee status. _Backed by: `progress/BOARD.md`._

---

## Business & scalability

**Potential business model?**
Not tuition. A permanent waqf endowment (principal never spent, ~4%/year drawn)
covers a masjid's baseline cost; a low flat parent fee covers the buffer; sadaqah
funds scholarships. A masjid runs one endowment drive, then the pods run
indefinitely. _Backed by: `docs/pitch.md` → The funding._

**How does it scale beyond the prototype?**
Per masjid. The schema is multi-tenant from day one (`masjid_id` on every table).
Math and AI-literacy content is generated once and reused across every masjid;
only Seerah is community-specific, and the app already lets a masjid's scholars
author and revise it. Multi-masjid onboarding is roadmapped (T63). _Backed by:
`docs/DATA_MODEL.md`, `progress/tasks/T22`._

**What would it take to make it a real product?**
Real auth + RLS (T30/T31), Quebec Law 25 compliance + parental consent
(T36/T37), legal pages (T38), French localisation (T59), accessibility (T60),
and a Canadian-region database (T39). The order is in `docs/roadmap.md`.

**Who would pay?**
Families pay a small flat fee. Donors fund the endowment and scholarships
(sadaqah). The masjid administers it. No one pays per-lesson or per-seat.
_Backed by: `docs/pitch.md`._

**Cost of running / is it sustainable?**
Content is generated once and persisted, and grading is code — so AI is a
one-time ~$0.30 per curriculum unit per masjid, not a per-student cost. The
marginal cost of another student in an existing pod is ≈ nothing. A $250K
endowment at 4% yields ~$10K/year, which covers estimated per-masjid operating
cost (~$6–10K). Viable from the first family. _Backed by:
`docs/research/model-economics.md`, `docs/pitch.md` → Unit economics._

---

## Team & process

_(Fill in with what actually happened.)_

**How did the team divide the work?**
→ e.g. by dashboard / by layer (AI pipeline, DB, UI) / by rubric section. The
repo has a multi-agent tracker (`progress/`) with a task claim per person and an
append-only journal — point at that as the coordination mechanism.

**What did you learn?**
→ candidate: that persisting generated content (not regenerating per view) is
what makes the economics work; that objective-only grading was the right scope
cut; that the continuity briefing is the demo's emotional beat.

**What would you do differently?**
→ candidate: wire real auth earlier; set up tests + CI on day one instead of at
the end.

**How did you prioritise features?**
The PRD ranked the differentiators by tier and "build vs mock"; the build order
is in `TASKS.md`; T18/T19 (unique IP, demoable) came before pitch-only screens.
_Backed by: `PRD.md` §5.4, `TASKS.md`._

---

## Data & privacy

**What data does the project use?**
Student and parent names + email, role, which pod, and academic results
(checkpoint/assessment/exam), plus volunteer names and short session notes.
Deliberately not collected: address, phone, DOB, anything medical. _Backed by:
`docs/data-map.md`._

**How do you handle privacy / security?**
Every query is scoped by `masjid_id` from the session; a security review found and
fixed a cross-tenant write and hardened the one string-built DB filter. A
data-integrity script checks tenancy invariants. For a real pilot: Quebec Law 25
(not GDPR), parental consent for minors, a Canadian-region database, and
pseudonymising students before the one cross-border AI call — all roadmapped
(T36/T37/T39). _Backed by: `docs/review/2026-09-05-audit.md`,
`docs/data-map.md`, `.claude/skills/security-review/`._

**Ethical risks?**
It's minors' education data and an AI teaching children — so: the model can be
wrong (mitigated by objective, code-checked grading and persisted, reviewable
content; a Seerah lesson is annotated by the masjid's scholars); over-reliance on
one vendor (there's a hand-authored fallback for every AI call); and the
compliance status could mislead if treated as official (every such screen carries
a "verify with current regulation" note). _Backed by: `components/RegulationNote`,
`lib/ai/fallback-*`, `docs/compliance/quebec-home-instruction.md`._

**Does it depend on an LLM?**
Yes — Claude generates the instructional content and the handoff briefing. But
it's not a chatbot wrapper: content is generated once and persisted, grading is
deterministic, and every AI call has a hand-authored fallback so a demo (or a
class) never stalls on a model outage. _Backed by: `lib/ai/client.ts` (30s
timeout → fallback), `lib/ai/fallback-*.ts`._

---

## Future plans

**What would you build next with more time?**
Real auth + a sign-up page with per-role accounts (T30), then Law 25 + consent,
then French. Product-wise: the adaptive remediation branch (T42) and the grounded
AI lesson tutor (T45). _Backed by: `docs/roadmap.md` → pilot order._

**Will you keep working on it after today?**
→ (team answer). If yes: the roadmap is already written and prioritised in
`docs/roadmap.md`.

**First step after the hackathon?**
Move the database to a Canadian region (minutes while it's one masjid), stand up
real auth, and take the pitch to 3–5 Greater-Montreal masjids for a one-term
pilot. _Backed by: `docs/data-map.md` → migration plan, `docs/pitch.md` → The ask._

---

## Closing questions

**What makes it different from existing options?**
AI tutoring is crowded and on-chain waqf transparency exists — separately. Nobody
combines pod continuity + Islamic education + community-funded compliance for this
problem. Concretely: no tutoring platform treats volunteer handoff as pedagogical
memory transfer; existing homeschool tools are backward-looking recordkeeping,
not an early-warning system; existing waqf-tech stops at "where did the money go".
_Backed by: `PRD.md` §5.4, `docs/pitch.md` → The moat._

**What help or resources would you need to keep going?**
Introductions to Greater-Montreal masjids willing to run a pilot pod; a Quebec
education lawyer to confirm the compliance mapping (the checklist is written —
`docs/compliance/quebec-home-instruction.md`); and a modest founding endowment
per pilot masjid.

**What do you want judges to remember most?**
The community sustains the learner. Suffa makes homeschooling that survives
volunteer churn, produces a real compliance record, and is free-to-low-cost for
families — funded by a waqf, not tuition, and viable from the first family.

**Why should this project win?**
It solves a real, specific problem for an underserved community end-to-end — not a
slice, the whole loop works — with a funding model that's genuinely sustainable
(the numbers are worked out and sourced), a technical build that's tested and
audited, and a differentiator (the Continuity Fingerprint) that no one else has.
