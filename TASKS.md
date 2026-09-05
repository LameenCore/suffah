# Build Order — Suffa Hackathon Checklist

Read `CLAUDE.md`, `PRD.md`, `docs/ARCHITECTURE.md`, and `docs/DATA_MODEL.md` before starting. Build in this order — each phase should leave you with something demoable, in case time runs out early.

## Phase 1 — Skeleton (get something running)
- [ ] Next.js app scaffolded, Tailwind configured
- [ ] Supabase project created: Postgres + Auth
- [ ] Schema from `docs/DATA_MODEL.md` migrated (core tables only: `masjids`, `users`, `pods`, `pod_students`, `courses`, `pathway_nodes`, `units`, `pod_progress`)
- [ ] Three route groups stubbed: `/admin`, `/parent`, `/student`, each with a placeholder page and role-gated auth

## Phase 2 — The core loop (this IS the demo)
- [ ] `lib/ai/lesson.ts` — generate + persist one lesson node for Math, one for Seerah, one for AI Literacy
- [ ] Student playground page: render a lesson, mark as complete
- [ ] `lib/ai/checkpoint.ts` — generate + grade a checkpoint question tied to a lesson node
- [ ] Checkpoint result persists to `checkpoint_results`, gates progression to next node
- [ ] **Milestone check:** a student can complete one lesson → one checkpoint → advance to next node, in at least one course. If this works, you have a demoable core.

## Phase 3 — Assessment layer
- [ ] `lib/ai/assessment.ts` — generate a unit assessment (pulls from 2–3 checkpoint nodes' worth of material)
- [ ] Unit assessment result persists to `unit_assessment_results`
- [ ] Term exam variant (timed, no remedial branch) — can reuse most of the unit assessment logic with a flag
- [ ] Term exam result persists to `term_exam_results`

## Phase 4 — Parent + Admin views (surface the data you already have)
- [ ] Parent dashboard: pull and display a student's progress bar, checkpoint/assessment/exam results per course
- [ ] Admin dashboard: pod list, pod assignment (enforce 4-student cap), continuity view (`pod_progress` per pod per course)
- [ ] Compliance report generation: aggregate a student's results into a `compliance_reports` record, basic exportable view (even a styled printable page is enough for the demo)

## Phase 5 — Funding ledger (business-model proof, not software depth)
- [ ] `waqf_ledger` table populated with mock entries: one principal deposit, several return-disbursed entries, a couple sadaqah/scholarship entries
- [ ] Admin dashboard ledger view: show principal balance (flat, untouched) vs. cumulative return spent — this is a chart, not a transaction engine
- [ ] Family fee status view: a couple of mock students marked `fee_paid`, one marked `scholarship_covered`

## Phase 6 — Polish for the pitch (only if time remains)
- [ ] Volunteer onboarding form + churn log (admin) — can be minimal, just needs to exist for the churn-continuity story
- [ ] "Verify with current regulation" disclaimer visible on any compliance/legal-adjacent screen
- [ ] Seed data cleaned up so the demo walkthrough is smooth start to finish (one pod, 3–4 students, one volunteer, all three courses with at least one completed unit)

## What to skip entirely (do not spend time here)
- Real payments, real donation processing
- Real volunteer background-check integration
- Subjective/rubric AI grading
- Multi-jurisdiction legal logic
- Full curriculum coverage beyond one unit per course

## Demo script (for when you present)
1. Show a student completing a lesson + checkpoint in the playground (proves AI-as-constant-teacher)
2. Show the parent dashboard reflecting that result immediately (proves the monitoring layer)
3. Show the admin continuity view — reassign the pod's volunteer, show the new volunteer instantly sees the current node (proves the churn-resilience pitch point)
4. Show the compliance report auto-generating from checkpoint + assessment + exam data (proves the regulatory pain point is solved)
5. Show the waqf ledger view — principal untouched, returns funding operations (proves the "viable after year one" funding story)

This order mirrors the pitch's problem → model → funding structure, so the demo doubles as the pitch narrative.
