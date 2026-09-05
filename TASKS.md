# Build Order - Suffa Hackathon Checklist

Read `CLAUDE.md`, `PRD.md`, `docs/ARCHITECTURE.md`, and `docs/DATA_MODEL.md` before starting. Build in this order - each phase should leave you with something demoable, in case time runs out early.

## Phase 1 - Skeleton (get something running)
- [ ] Next.js app scaffolded, Tailwind configured
- [ ] Supabase project created: Postgres + Auth
- [ ] Schema from `docs/DATA_MODEL.md` migrated (core tables only: `masjids`, `users`, `pods`, `pod_students`, `courses`, `pathway_nodes`, `units`, `pod_progress`)
- [ ] Three route groups stubbed: `/admin`, `/parent`, `/student`, each with a placeholder page and role-gated auth

## Phase 2 - The core loop (this IS the demo)
- [ ] `lib/ai/lesson.ts` - generate + persist one lesson node for Math, one for Seerah, one for AI Literacy
- [ ] Student playground page: render a lesson, mark as complete
- [ ] `lib/ai/checkpoint.ts` - generate + grade a checkpoint question tied to a lesson node
- [ ] Checkpoint result persists to `checkpoint_results`, gates progression to next node
- [ ] **Milestone check:** a student can complete one lesson → one checkpoint → advance to next node, in at least one course. If this works, you have a demoable core.

## Phase 3 - Assessment layer
- [ ] `lib/ai/assessment.ts` - generate a unit assessment (pulls from 2–3 checkpoint nodes' worth of material)
- [ ] Unit assessment result persists to `unit_assessment_results`
- [ ] Term exam variant (timed, no remedial branch) - can reuse most of the unit assessment logic with a flag
- [ ] Term exam result persists to `term_exam_results`

## Phase 4 - Parent + Admin views (surface the data you already have)
- [ ] Parent dashboard: pull and display a student's progress bar, checkpoint/assessment/exam results per course
- [ ] Admin dashboard: pod list, pod assignment (enforce 4-student cap), continuity view (`pod_progress` per pod per course)
- [ ] Compliance report generation: aggregate a student's results into a `compliance_reports` record, basic exportable view (even a styled printable page is enough for the demo)

## Phase 5 - Funding ledger (business-model proof, not software depth)
- [ ] `waqf_ledger` table populated with mock entries: one principal deposit, several return-disbursed entries, a couple sadaqah/scholarship entries
- [ ] Admin dashboard ledger view: show principal balance (flat, untouched) vs. cumulative return spent - this is a chart, not a transaction engine
- [ ] Family fee status view: a couple of mock students marked `fee_paid`, one marked `scholarship_covered`

## Phase 6 - Polish for the pitch (only if time remains)
- [ ] Volunteer onboarding form + churn log (admin) - can be minimal, just needs to exist for the churn-continuity story
- [ ] "Verify with current regulation" disclaimer visible on any compliance/legal-adjacent screen
- [ ] Seed data cleaned up so the demo walkthrough is smooth start to finish (one pod, 3–4 students, one volunteer, all three courses with at least one completed unit)

## Phase 7 - Differentiators (the moat)

Added after competitive research (see PRD §5.4). AI tutoring and waqf-transparency both
exist separately; the defensible thing is the *combination* for this specific problem.
Build priority: **T18 → T19** first (unique IP, demoable), then **T20**; T21/T22 as
mocked pitch screens.

- [ ] **T18 · Continuity Fingerprint** - `pod_session_notes` + `lib/ai/continuity.ts` generates a persisted AI handoff briefing (how the pod learns, not just where it is); surfaced on the Admin continuity view
- [ ] **T19 · Live "empty seat" simulation** - repeatable on-stage flow: volunteer offline → pod unaffected → reassign → T18 briefing generates live; one-click reset
- [ ] **T20 · Living compliance report** - `lib/compliance/status.ts` computes per-course on-track / watch / gap from live data with human-readable signals; shown on parent + admin, export is a snapshot of it
- [ ] **T21 · Waqf-to-outcome linking** (mock) - sponsorship map (ledger entry → pod + unit) → anonymized outcome trace in the transparency view
- [ ] **T22 · Community Seerah sourcing** (mock/text) - `lesson_contributions` + regenerate a lesson folding in scholar notes; "revised with community input" indicator
- [ ] **T23 · Pod "Barakah meter"** - `pod_barakah_log` + check-in form; values-framed summary (adab/cooperation/consistency), no points or leaderboard
- [ ] **T24 · Waqf principal "never touched" visual** - inline SVG on the ledger view: locked principal vs. thin returns-spent outflow, theme-aware

## What to skip entirely (do not spend time here)
- Real payments, real donation processing
- Real volunteer background-check integration
- Subjective/rubric AI grading
- Multi-jurisdiction legal logic
- Full curriculum coverage beyond one unit per course

## Demo script (for when you present)
Run `npm run demo:setup` once, then `npm run demo:reset` before each practice run.
Sign-in is the role picker on `/` (or `NEXT_PUBLIC_SUFFA_DEV_ROLE`). The seeded state
leaves **Yusuf fresh on Math** for step 1; Maryam/Idris/Safiya carry the compliance spread.

1. **Student** (`/student` -> Math): the lesson, mark it complete, the checkpoint appears, pass it -> the pod advances to the next node. *The AI as the constant teacher.*
2. **Parent** (`/parent`, `/parent/compliance`): Yusuf's new checkpoint result is already there, and the evaluation status updates live. *The monitoring layer, zero effort.*
3. **Admin -> Live handoff simulation** (`/admin/handoff-demo`): take Br. Kareem offline mid-session - the student playground keeps working - then assign Sr. Amina and watch the **Continuity Fingerprint** briefing generate on screen. *Churn-resilience, performed not described.*
4. **Admin -> Compliance report** (`/admin/compliance`): pick Idris (gap forming - Math pass rate) vs. Yusuf (on track); the status is assembled live from checkpoint + assessment + exam data. Save a snapshot, open the printable view. *The regulatory pain point, turned into an early-warning system.*
5. **Admin -> Waqf ledger** (`/admin/ledger`): principal locked and untouched (T24 visual), only returns spent; the waqf-to-outcome view (T21) links a donation to a pod's actual unit completion. *Viable after year one, and donors see the learning, not just the ledger.*

This order mirrors the pitch's problem → model → funding structure, so the demo doubles as the pitch narrative.
