# Decision log — how we arrived at this solution

_Task T75. The "walk us through your thinking" answer. Each entry: the decision,
what else we considered, why this, and what would change our mind._

---

## 1. Pods as the central entity — not individual students

**Decision.** Everything hangs off a *pod* (≤4 students). Course pathways are
assigned to pods; a pod moves through the curriculum together.
**Considered.** Per-student pathways (like a normal LMS).
**Why.** The real-world unit is a few families sharing a room at the masjid with
a rotating volunteer. Modelling that directly makes the continuity story
(volunteer handoff) and the compliance story (a pod's shared position) natural.
The ≤4 cap aligns with Quebec's "not a school" threshold (`docs/compliance/…`).
**Would change our mind.** If pilot masjids actually run 1:1 or large groups.

## 2. AI *carries* instruction — it doesn't just assist a human teacher

**Decision.** The model generates the lessons, checkpoints, assessments, and
exams. Volunteers do in-person enrichment, not primary teaching.
**Considered.** AI as a teacher's aide (lesson-plan generator, à la MagicSchool),
with a human still delivering instruction.
**Why.** The problem we're solving *is* volunteer churn. If a human must deliver
instruction, their departure still stops learning. Only by making the software
the constant does the pod survive a handoff.
**Would change our mind.** If families reject AI-delivered instruction for
children outright — mitigated by the Seerah community-review pipeline (#8).

## 3. Waqf endowment funding — not tuition or subscription

**Decision.** Permanent endowment (principal never spent, ~4% drawn) + a low flat
parent fee + sadaqah scholarships.
**Considered.** Per-seat SaaS pricing (Khanmigo's $15/student/yr), tuition
(Islamic-school model), donations-only.
**Why.** Seat pricing scales cost with enrollment; our marginal cost is ≈ $0, so
that would overcharge. Tuition needs scale to break even and excludes families
who can't pay. An endowment is a single fundraising act masjids already know how
to do, and it makes the service viable from the first family
(`docs/cost-model.md`).
**Would change our mind.** If masjids can't or won't raise a ~$75–165K endowment
— then a coordinator stipend covered by the flat fee alone (the Lean scenario).

## 4. Objective grading only — no rubric / subjective AI grading

**Decision.** Checkpoints, assessments, exams are MCQ / short-numeric /
short-answer, graded by deterministic code (`lib/ai/questions.ts`).
**Considered.** LLM-graded open responses (essays, Seerah reflection).
**Why.** Reliability for a compliance artifact, and it removes a whole class of
"the AI graded my kid unfairly" risk for a demo and a pilot. Stated as a PRD
non-goal.
**Would change our mind.** When there's a trustworthy rubric-grading approach
*and* a human-review step — a roadmap item, not a hackathon one.

## 5. Persist generated content — never regenerate on view

**Decision.** A lesson / checkpoint / exam is generated once and stored on the
row; every view reads the stored copy.
**Considered.** Generate on demand each time a student opens a node.
**Why.** Two reasons. **Continuity**: a pod (and its handoff briefing) depends on
stable, referenceable content. **Economics**: this turns AI from a
per-student-per-view cost into a one-time ~$0.58 per curriculum unit per masjid —
the single fact that makes the funding model work.
**Would change our mind.** Never for this product — it's load-bearing.

## 6. Living compliance status — not a term-end PDF

**Decision.** Checkpoint/assessment/exam results assemble continuously into an
"on track / watch / gap forming" read per course, plus a snapshot.
**Considered.** A backward-looking record you export at term-end (what generic
homeschool tools do).
**Why.** Families miss the deadline or discover a gap too late. An early-warning
view is genuinely more useful and is a clear differentiator. The thresholds are
hardcoded and flagged "verify with regulation".
**Would change our mind.** If a Quebec evaluator says only a fixed-format
term-end document is acceptable — then the snapshot becomes primary and the
live view is an internal aid.

## 7. Multi-tenant from day one — `masjid_id` on every table

**Decision.** Every table carries `masjid_id`; every query filters by it from the
session.
**Considered.** Single-tenant now, refactor later (there's only one demo masjid).
**Why.** It costs almost nothing up front and avoids a schema rewrite when the
scale story ("any masjid can run this") gets questioned. It also forced us to
get tenant isolation right early (the security audit found one gap, now fixed).
**Would change our mind.** Nothing — this was cheap and correct.

## 8. Community knowledge sourcing for Seerah — AI draft + human annotation

**Decision.** The model drafts a Seerah lesson; the masjid's scholars/elders add
text notes; "Incorporate" folds them into a new version.
**Considered.** Fully AI-authored Seerah (risky for religious content); fully
human-authored (no vendor builds this, and it doesn't scale).
**Why.** It's a genuine AI + community hybrid that only makes sense with this
exact community structure — and it's an honest answer to "can we trust the AI on
religious content".
**Would change our mind.** If scholars find the review burden too high — then
pre-vet a fixed Seerah unit and skip per-node review.

## 9. Next.js + Supabase + Anthropic — one app, no extra services

**Decision.** A single Next.js 16 app, Supabase for Postgres/Auth/storage,
Anthropic for generation, Vercel to host.
**Considered.** A separate Python service for the AI/grading logic; a vector DB;
microservices.
**Why.** All the AI logic is a handful of prompt templates + deterministic
grading — no retrieval, no embeddings, no heavy compute. One app is faster to
build, easier to audit, and cheap to run. See `docs/ARCHITECTURE.md`.
**Would change our mind.** If grading grows to need Python ML libraries, or if
content retrieval (a real curriculum corpus) becomes core.

## 10. Dev-cookie auth first, real auth second

**Decision.** Built the three dashboards against a `SessionUser` shape resolved
from a dev role cookie; swapped in Supabase Auth once the surface was stable
(T30).
**Considered.** Real auth from day one.
**Why.** Auth wiring is orthogonal to proving the core loop, and every call site
was written against the real shape so the swap was contained (one file +
pages). It let the demo be built and shown while auth was still a stub.
**Would change our mind.** Nothing — but we'd wire real auth a bit earlier next
time so RLS (T31) could land in the same pass.

## 11. Anti-leaderboard "Barakah" indicators

**Decision.** Soft indicators (consistency, helping others, reflection, adab) are
recorded as observations and shown to parents as calm phrases — never a score,
rank, points, or streak-shaming.
**Considered.** Gamification (badges, points, leaderboards) — the EdTech default.
**Why.** It answers "what does this platform value besides test scores?" in a way
that fits the community's ethos. Gamification would undercut that.
**Would change our mind.** Nothing — the framing is the point. A gentle
"days engaged" habit nudge (T52) is the most we'd add, and only if it never
ranks students.

## 12. Three demo courses: Math, Seerah, AI literacy

**Decision.** Math (maps to a real Quebec curriculum — the compliance-credibility
subject), Seerah (community-specific, no vendor would build it), AI literacy
(the platform's own meta-narrative).
**Considered.** A single subject; a broader spread.
**Why.** Three courses prove the model handles both compliance-mapped content and
content no curriculum body exists for. AI literacy also lets the product teach
kids what the thing teaching them actually is.
**Would change our mind.** Add French/English language arts before a real pilot —
it's the other compliance-heavy subject.
