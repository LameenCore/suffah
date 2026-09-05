# Suffa — the pitch

_Community-sustained homeschool pods for Quebec Muslim families. A
business-model deliverable: how the service operates and stays viable, not just
what the software does. Numbers are sourced or labelled as assumptions — see
`docs/research/model-economics.md`._

---

## In 30 seconds

Community-run homeschool **pods** (≤4 kids, at the masjid) solve cost and
socialisation but **break on volunteer churn**. Suffa fixes that: **AI carries
the curriculum** — lessons, checkpoints, exams, compliance — so instruction never
stops; volunteers do in-person enrichment; a volunteer leaving is a briefed
handoff, not an outage. Funded by a **waqf endowment** (principal never spent,
~4%/yr drawn) + a flat parent fee + sadaqah scholarships — **not tuition, and
viable from the first family**, because content is generated once (~$0.30 per
unit per masjid) and the marginal cost of another student is ≈ nothing.

---

## The problem

Quebec Muslim families who want to homeschool face a four-way trade-off with no
good corner: **quality** (a parent can't teach every subject), **cost** (private
Islamic school is ~$8–15K/child/year and tuition-dependent), **compliance**
(Quebec requires a learning project and periodic evaluation), and **socialisation**
(homeschooling alone is isolating).

Community-run **pods** — a few families, a shared space at the masjid, a rotating
volunteer teacher — solve socialisation and cost. But they break on **volunteer
churn**: when the volunteer teaching Grade 6 math leaves, instruction stops until
someone else ramps up, and continuity is lost.

## The model

**The AI carries the curriculum; the community carries everything else.**

- **AI delivers instruction and formal assessment**, continuously, through a
  self-paced playground — lessons, checkpoints, unit assessments, term exams. It
  does not stop when a volunteer leaves.
- **Volunteers run live enrichment and socialisation** in person — discussion,
  projects, mentorship — not primary instruction. Their departure is now a
  handoff, not an outage: an AI **Continuity Fingerprint** briefs the next
  volunteer on *how* the pod has been learning.
- **Parents monitor** through a read-only dashboard. **The masjid administers**
  pods (hard cap of 4 students, matching Quebec's home-instruction exemption),
  volunteers, and compliance.
- **Compliance is a living document**, not a term-end scramble: checkpoint, unit,
  and exam results assemble continuously into an early-warning "on track / gap
  forming" view and an exportable record.

Pods stay ≤4 students per Quebec's exemption threshold. Legal and evaluation
specifics are flagged in-product as "verify with current regulation" — the
platform organises the evidence, it does not give legal advice.

## The funding — waqf, not tuition

Named for the *Ashab al-Suffa*, companions sustained by the community so they
could dedicate themselves to learning. Three layers:

| Layer | Covers | Mechanism |
|---|---|---|
| **Waqf endowment** | baseline operating cost | Permanent principal, **never spent**. Only the return is drawn — a conservative **~4%/year**, which preserves the principal through downturns. |
| **Flat parent fee** | the buffer above baseline | Low, permanent, the same for every family. Not tuition — it does not scale with cost of delivery, because delivery cost barely scales. |
| **Sadaqah** | scholarships | Funds the flat fee for families who can't pay it. A separate stream that never touches the principal. |

A masjid raises **one founding endowment drive** — the same thing masjids already
do for buildings — and then the pods run indefinitely. It is not tuition-
dependent and does not need scale to break even.

## Unit economics — why the AI is cheap here

The platform **generates each lesson, checkpoint, and exam once and persists it**
(the codebase enforces this — content is never regenerated on view). So:

- **One-time content cost: ~$0.30 per curriculum unit per masjid** (3 courses ×
  lesson + checkpoint + assessment + exam, at Claude Sonnet 5 rates). Generated
  once, served to every student in every pod, reused across terms.
- **Grading cost: ~$0.** Objective formats (MCQ, short numeric) are graded in
  code, not by the model.
- **Per-pod handoff briefing: ~$0.02**, only when a volunteer changes.
- **Marginal cost of adding a student to an existing pod: ≈ nothing.**

Illustrative: a **$250,000 founding waqf** at a 4% draw yields **$10,000/year**.
Estimated per-masjid operating cost — hosting + a part-time community-coordinator
stipend, volunteers unpaid — is **~$6–10K/year** for a masjid running several
pods _(assumption, not a sourced figure)_. The endowment covers baseline; the
flat fee covers the rest; sadaqah covers the families who can't. **The model is
viable from the first family** — the only hard part is raising the endowment, and
that is a fundraising problem masjids already know how to solve.

Contrast: a tuition-funded Islamic school needs ~$8–15K/child/year and only
breaks even at scale, so it can't serve a handful of families in one
neighbourhood. Suffa can.

## Market

- **~7,900** homeschooled children in Quebec (0.8% of school-age, growing since
  2019); true figure likely higher (imperfect registration).
- **~421,710** Muslims in Quebec (2021 census, ~5% of the province),
  concentrated in Greater Montreal.
- **Near-term:** a Greater-Montreal pilot of ~5–10 masjids, ~4–8 pods each, 3–4
  students per pod → ~100–250 students. The **Math and AI-literacy content is
  reusable across every masjid**; only community-specific content (Seerah) is
  per-masjid, and the platform already lets a masjid's scholars author and revise
  it (community knowledge sourcing).
- **Scale path:** replicate per masjid. Each new masjid needs an endowment drive
  and adopts the shared curriculum; the platform's multi-tenant model is built in
  from day one.

## The moat

AI tutoring is crowded and on-chain waqf transparency exists — but the three
adjacent markets each stop short (full comparison in
`docs/research/market-and-competitors.md`): AI tutors (Khanmigo, MagicSchool,
MATHia) tutor subjects, seat-priced, no Islamic content or compliance or
continuity; Islamic homeschool is full accredited schools on tuition (Sahlah) or
live-teacher services with the churn+cost problem (Zaid) or content only
(Allamah); waqf-tech (WaqfChain, baraka.fund) stops at fund flow. The defensible
thing is the **combination for this specific problem**: **pod continuity +
Islamic education + community-funded compliance.** Concretely:

- **Continuity Fingerprint** — no tutoring platform treats teacher/volunteer
  handoff as pedagogical memory transfer.
- **Living compliance report** — an early-warning system, where existing
  homeschool tools are backward-looking recordkeeping.
- **Waqf-to-outcome linking** — a donor who funded a pod's unit sees the
  anonymised learning outcome, where existing waqf-tech stops at "where did the
  money go".
- **Community knowledge sourcing** — masjid scholars annotate the AI's Seerah
  draft; it folds into the next version. A genuine AI + community hybrid that
  only makes sense with this exact structure.

## What's built (hackathon)

A working demo of the full loop across three courses (Math, Seerah, AI literacy),
one unit each:

1. **Student** completes a lesson → checkpoint → the pod advances.
2. **Parent** sees the result and the live evaluation status immediately.
3. **Admin** takes a volunteer offline mid-session — the playground keeps
   running — assigns a replacement, and the Continuity Fingerprint briefing
   generates on screen.
4. **Admin** opens the living compliance report: Idris (gap forming) vs Yusuf (on
   track), assembled from real results; snapshot + printable view.
5. **Admin** opens the waqf ledger: principal locked and untouched, only returns
   spent, and a contribution traced to a pod's actual unit completion.

Funding ledger, volunteer vetting, and payment rails are mocked for the demo (see
PRD §6). The build is tested (grading + the compliance-status engine at ~98–100%
coverage), security-audited, and green on lint / typecheck / a data-integrity
check. The post-hackathon roadmap (`docs/roadmap.md`) covers real auth, Quebec
Law 25, French localisation, and the path to multi-masjid.

## The ask

A **pilot partnership** with 3–5 Greater-Montreal masjids: run one pod each for a
term, seed a modest founding waqf per masjid, and measure completion,
family retention, volunteer-churn resilience, and cost per active student against
the model above.
