# Product Requirements Document — Suffa

*AI-Sustained Homeschool Pods for Quebec Muslim Families*

## 1. Overview

**Product:** A three-dashboard platform (Masjid Admin, Parent, Student) built around an AI-led curriculum playground, supporting a pod-based homeschool model for Quebec Muslim families, sustained by a waqf/fee/sadaqah funding structure.

**Name origin:** Suffa refers to the Ashab al-Suffa — companions of the Prophet Muhammad ﷺ who lived at the mosque in Medina, sustained by the community so they could dedicate themselves fully to learning. The platform's funding logic mirrors that precedent: the community sustains the learner.

**Problem statement:** Quebec Muslim families need compliant, affordable, community-connected homeschooling, but existing options force trade-offs between quality, cost, compliance, and socialization. Community-run pods solve this but suffer from high volunteer churn, which breaks continuity of instruction.

**Solution summary:** AI delivers core instruction and formal assessment continuously through a self-paced playground; volunteers provide live enrichment and socialization; masjid administers pods and compliance; parents monitor. Funded by a permanent waqf endowment (baseline costs) + flat low parent fee (marginal costs) + sadaqah (scholarships).

**Hackathon scope note:** Per the brief, this is a business-model deliverable first. The build should demonstrate one working core workflow (AI playground: lesson → checkpoint → unit assessment → progress report), not a full production system.

## 2. Target Age & Curriculum Scope

- **Age band:** 10–13, spanning Quebec's late-primaire to early-secondaire range
- **Demo scope decision:** target one grade band for the build — **Secondary 1 equivalent (~12 years old)** — to keep curriculum mapping focused; the model extends across the full 10–13 range post-hackathon
- **Demo courses (three):**
  - **Math** — maps to an existing Quebec curriculum progression; the strongest compliance-story subject
  - **Seerah** — community-specific content with no external curriculum body; demonstrates the model works for content no vendor would ever build
  - **AI (literacy)** — age-appropriate intro to how AI works; reinforces the platform's own meta-narrative

## 3. Goals & Success Metrics

**Goals**
- Prove the AI playground can deliver a real curriculum unit with checkpoint-based mastery tracking
- Prove the platform can run a credible, gradeable formal assessment — not just lesson checkpoints
- Show that progress and assessment data flow automatically into a compliance-ready report
- Demonstrate the three dashboards are structurally distinct and role-appropriate

**Success metrics (for the MVP demo, not production)**
- A student can complete one full lesson node end-to-end in the playground, across at least one of the three courses
- A checkpoint result and a unit assessment result both correctly populate the parent view and an exportable admin report
- Admin dashboard can onboard a mock volunteer and assign them to a pod in under 2 minutes (demo scenario)

## 4. Users & Roles

| Role | Who | Primary need |
|---|---|---|
| Masjid Admin | Community coordinator/trustee | Onboard/vet volunteers, assign pods, generate compliance reports, track waqf/donation ledger |
| Parent | Family of enrolled child | Monitor progress, see schedule, minimal management burden |
| Student | Child in a pod (10–13, demo at Secondary 1 level) | Learn core content at own pace via playground; complete assessments; participate in pod sessions |
| Volunteer (secondary, accessed via Admin) | Community teacher | Lead enrichment sessions; view pod's current curriculum node |

## 5. Core Features by Dashboard

### 5.1 Masjid Admin Dashboard
- **Volunteer management:** onboarding form, certification/status tracking, churn log
- **Pod assignment:** create pods (max 4 students, per legal exemption), assign volunteer + students
- **Compliance reporting:** auto-generate Quebec-required progress/evaluation reports from checkpoint AND exam data, exportable per student/pod
- **Funding ledger:** waqf principal (locked, read-only) vs. annual return spent vs. sadaqah/scholarships allocated — transparency view for donors
- **Continuity handoff view:** when a volunteer leaves, show incoming volunteer exactly which pathway node each of their pod's students is on, per course

### 5.2 Parent Dashboard
- Child's current pathway + progress bar, per course (Math / Seerah / AI)
- Checkpoint results (pass/needs review)
- Unit assessment and term exam results — the "report card" view
- Pod schedule (live session days/times)
- Fee/sponsorship status (flat fee paid, or scholarship-covered)
- Lightweight — no lesson management, no grading tools

### 5.3 Student Dashboard (Playground)
- Pathway view: sequential lesson nodes per course, scoped to pod's current curriculum unit
- AI-led lesson delivery: explanation + interactive practice
- **Three-tier assessment structure:**
  1. **Checkpoints** (per lesson node) — low-stakes, immediate, gates progression; branches to remedial mini-lesson on failure
  2. **Unit assessments** (per pathway section) — cumulative quiz across several checkpoints' material, marks topic mastery, feeds the formal progress report
  3. **Term exam** (per course, term-end) — timed, no remedial branching mid-exam, mimics a real school exam; primary artifact for compliance credibility
- Self-paced within the shared pod topic (same lesson, adjustable depth — supports mixed ability within a 3–4 student pod)
- **Grading approach:** assessments kept primarily objective (MCQ, short numeric/short-answer) for demo reliability; open-ended reflection questions (e.g., Seerah) can appear in lessons but are excluded from graded exams for this scope

## 6. Non-Goals (for hackathon scope)

- Full curriculum coverage across all subjects/grades — one unit per course is sufficient to prove the mechanism
- Rubric-based AI grading of subjective/open-ended answers — deferred; demo uses objective assessment formats only
- Payment processing / real donation handling — ledger can be mocked data
- Real volunteer background-check integration — represent as a status field, not a live vetting service
- Multi-jurisdiction legal logic — demo Quebec only, note portability in the pitch
- Full 10–13 grade-band coverage — demo targets one grade level, with extensibility noted in the pitch

## 7. Key Data Flows

1. Student completes a checkpoint in the playground → result stored
2. Student completes a unit assessment → result stored, flagged as compliance-relevant
3. Student completes a term exam → result stored, becomes primary evidence in the compliance report
4. All three feed: (a) parent dashboard progress/report view, (b) admin compliance report, (c) pod continuity record (which node/unit the pod is on, per course)
5. Admin assigns/reassigns volunteer to pod → continuity view shows current node per course so no re-teaching or gaps occur
6. Admin logs a donation or waqf return disbursement → ledger updates, principal balance untouched

## 8. Constraints (from the brief, carried into requirements)

- Pods must stay under Quebec's exemption threshold (fewer than 5 students per instructor at a time) — enforce as a hard cap in pod creation
- This is a business-model deliverable — the PRD should describe *how the service operates and stays viable*, not just software specs
- Legal/compliance elements (reporting format, exemption rules, exam equivalency standards) should be flagged in-product as "verify with current regulation," not presented as legal advice

## 9. Open Questions Before Build

- Confirm Secondary 1 (or chosen band) curriculum outline for Math specifically, to ensure the demo unit maps to a real, checkable Quebec requirement
- What does a passing threshold look like for unit assessments/term exams (e.g., 70% to advance)?
- Does the term exam need a printable/exportable format for the compliance report, or is an in-dashboard record sufficient for the hackathon demo?
