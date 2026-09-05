# Product Requirements Document - Suffa

*AI-Sustained Homeschool Pods for Quebec Muslim Families*

## 1. Overview

**Product:** A three-dashboard platform (Masjid Admin, Parent, Student) built around an AI-led curriculum playground, supporting a pod-based homeschool model for Quebec Muslim families, sustained by a waqf/fee/sadaqah funding structure.

**Name origin:** Suffa refers to the Ashab al-Suffa - companions of the Prophet Muhammad ﷺ who lived at the mosque in Medina, sustained by the community so they could dedicate themselves fully to learning. The platform's funding logic mirrors that precedent: the community sustains the learner.

**Problem statement:** Quebec Muslim families need compliant, affordable, community-connected homeschooling, but existing options force trade-offs between quality, cost, compliance, and socialization. Community-run pods solve this but suffer from high volunteer churn, which breaks continuity of instruction.

**Solution summary:** AI delivers core instruction and formal assessment continuously through a self-paced playground; volunteers provide live enrichment and socialization; masjid administers pods and compliance; parents monitor. Funded by a permanent waqf endowment (baseline costs) + flat low parent fee (marginal costs) + sadaqah (scholarships).

**Hackathon scope note:** Per the brief, this is a business-model deliverable first. The build should demonstrate one working core workflow (AI playground: lesson → checkpoint → unit assessment → progress report), not a full production system.

## 2. Target Age & Curriculum Scope

- **Age band:** 10–13, spanning Quebec's late-primaire to early-secondaire range
- **Demo scope decision:** target one grade band for the build - **Secondary 1 equivalent (~12 years old)** - to keep curriculum mapping focused; the model extends across the full 10–13 range post-hackathon
- **Demo courses (three):**
  - **Math** - maps to an existing Quebec curriculum progression; the strongest compliance-story subject
  - **Seerah** - community-specific content with no external curriculum body; demonstrates the model works for content no vendor would ever build
  - **AI (literacy)** - age-appropriate intro to how AI works; reinforces the platform's own meta-narrative

## 3. Goals & Success Metrics

**Goals**
- Prove the AI playground can deliver a real curriculum unit with checkpoint-based mastery tracking
- Prove the platform can run a credible, gradeable formal assessment - not just lesson checkpoints
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
- **Funding ledger:** waqf principal (locked, read-only) vs. annual return spent vs. sadaqah/scholarships allocated - transparency view for donors
- **Continuity handoff view / Continuity Fingerprint:** when a volunteer leaves, the incoming volunteer gets more than a status snapshot ("Node 4 of Unit 2"). An AI-generated briefing summarises *how* the pod has been learning - where the group got stuck, which analogies worked, what a specific student struggles with - assembled from the pod's progress data plus short session notes. This turns volunteer churn from a data-loss event into a knowledge-transfer event, and is the single sharpest expression of the platform's moat (see §5.4).

### 5.2 Parent Dashboard
- Child's current pathway + progress bar, per course (Math / Seerah / AI)
- Checkpoint results (pass/needs review)
- Unit assessment and term exam results - the "report card" view
- Pod schedule (live session days/times)
- Fee/sponsorship status (flat fee paid, or scholarship-covered)
- Lightweight - no lesson management, no grading tools

### 5.3 Student Dashboard (Playground)
- Pathway view: sequential lesson nodes per course, scoped to pod's current curriculum unit
- AI-led lesson delivery: explanation + interactive practice
- **Three-tier assessment structure:**
  1. **Checkpoints** (per lesson node) - low-stakes, immediate, gates progression; branches to remedial mini-lesson on failure
  2. **Unit assessments** (per pathway section) - cumulative quiz across several checkpoints' material, marks topic mastery, feeds the formal progress report
  3. **Term exam** (per course, term-end) - timed, no remedial branching mid-exam, mimics a real school exam; primary artifact for compliance credibility
- Self-paced within the shared pod topic (same lesson, adjustable depth - supports mixed ability within a 3–4 student pod)
- **Grading approach:** assessments kept primarily objective (MCQ, short numeric/short-answer) for demo reliability; open-ended reflection questions (e.g., Seerah) can appear in lessons but are excluded from graded exams for this scope

### 5.4 Differentiators - the defensible combination

AI tutoring is now a crowded field (Khanmigo, TutorFlow, Jenova, and others all racing toward adaptive/agentic tutors), and even waqf-transparency-on-chain exists (WaqfChain, baraka.fund). The defensible novelty is **not any single feature** - it is combining things that exist separately in a way nobody has stitched together for *this specific problem*: **pod continuity + Islamic education + community-funded compliance.** The features below make that combination concrete. Tracked as tasks T18–T24.

| # | Feature | Tier | Hackathon | Why it's distinctive |
|---|---|---|---|---|
| T18 | **Continuity Fingerprint** - AI volunteer-handoff briefing (how the pod learns, not just where it is) | 1 | **build** | No tutoring platform treats volunteer/teacher handoff as pedagogical memory transfer |
| T19 | **Live "empty seat" simulation** - kill the volunteer mid-demo, show the pod continuing, then the handoff briefing generating live | 3 | **build** | Performs the core differentiator on stage instead of describing it |
| T20 | **Living compliance report** - continuously assembled, forward-looking "on track / gap forming" indicators, not a term-end PDF | 1 | **build** | Existing homeschool tools are backward-looking recordkeeping; this is an early-warning system |
| T21 | **Waqf-to-outcome linking** - a donor who funded a pod's unit sees the anonymized learning outcome, not just fund flow | 1 | mock screen | Existing waqf-tech stops at "where did the money go" |
| T22 | **Community knowledge sourcing for Seerah** - masjid scholars/elders react to AI lesson drafts; their notes fold into the next version | 2 | mock / text version | A genuine AI+community hybrid that only makes sense with this community structure |
| T23 | **Pod "Barakah meter"** - attendance/helpfulness/reflection, framed around adab and cooperation (not gamified points) | 2 | build | Answers "what does this platform value besides test scores?" |
| T24 | **Waqf principal "never touched" visual** - locked principal, thin returns-spent outflow | 3 | build | Teaches judges what waqf *is* in ~3 seconds |

Build priority for the remaining time: **T18 and T19** are the unique IP and are demoable; **T20** elevates the compliance story; **T21/T22** are compelling as pitch-deck screens with a mocked mapping.

## 6. Non-Goals (for hackathon scope)

- Full curriculum coverage across all subjects/grades - one unit per course is sufficient to prove the mechanism
- Rubric-based AI grading of subjective/open-ended answers - deferred; demo uses objective assessment formats only
- Payment processing / real donation handling - ledger can be mocked data
- Real volunteer background-check integration - represent as a status field, not a live vetting service
- Multi-jurisdiction legal logic - demo Quebec only, note portability in the pitch
- Full 10–13 grade-band coverage - demo targets one grade level, with extensibility noted in the pitch
- Voice-note capture for community Seerah sourcing (T22) - text notes prove the pipeline; voice is the productionization step
- On-chain / blockchain waqf ledger - the transparency view is the point, not the chain; mock ledger data is sufficient
- Real donor identity / auth for the waqf-to-outcome view (T21) - mocked sponsorship links

## 7. Key Data Flows

1. Student completes a checkpoint in the playground → result stored
2. Student completes a unit assessment → result stored, flagged as compliance-relevant
3. Student completes a term exam → result stored, becomes primary evidence in the compliance report
4. All three feed: (a) parent dashboard progress/report view, (b) admin compliance report, (c) pod continuity record (which node/unit the pod is on, per course)
5. Admin assigns/reassigns volunteer to pod → continuity view shows current node per course so no re-teaching or gaps occur
6. Admin logs a donation or waqf return disbursement → ledger updates, principal balance untouched

## 8. Constraints (from the brief, carried into requirements)

- Pods must stay under Quebec's exemption threshold (fewer than 5 students per instructor at a time) - enforce as a hard cap in pod creation
- This is a business-model deliverable - the PRD should describe *how the service operates and stays viable*, not just software specs
- Legal/compliance elements (reporting format, exemption rules, exam equivalency standards) should be flagged in-product as "verify with current regulation," not presented as legal advice

## 9. Open Questions Before Build

- Confirm Secondary 1 (or chosen band) curriculum outline for Math specifically, to ensure the demo unit maps to a real, checkable Quebec requirement
- What does a passing threshold look like for unit assessments/term exams (e.g., 70% to advance)?
- Does the term exam need a printable/exportable format for the compliance report, or is an in-dashboard record sufficient for the hackathon demo?
