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
1. Show a student completing a lesson + checkpoint in the playground (proves AI-as-constant-teacher)
2. Show the parent dashboard reflecting that result immediately (proves the monitoring layer)
3. **Live handoff simulation (T19):** take the pod's volunteer offline mid-session - the student's playground keeps working - then reassign a new volunteer and watch the **Continuity Fingerprint** briefing generate on screen (proves churn-resilience by *performing* it, not describing it)
4. Show the **living compliance report** (T20) - per-course "on track / gap forming" assembled from checkpoint + assessment + exam data, exportable (proves the regulatory pain point is solved, and turns it forward-looking)
5. Show the waqf ledger view - principal untouched (T24 visual), returns funding operations; optionally the waqf-to-outcome screen (T21) linking a donation to a pod's actual unit completion (proves the "viable after year one" funding story *and* donor trust)

This order mirrors the pitch's problem → model → funding structure, so the demo doubles as the pitch narrative.
