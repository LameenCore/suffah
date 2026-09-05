# Research: market & competitors — why this problem, why this angle

_Date: 2026-09-06 · Task T69 · Companion to `docs/pitch.md` and
`docs/research/model-economics.md`. Answers the rubric line "do (and document)
real research on why this problem/angle was worth choosing."_

## Answer (short)

Suffa sits in the gap between **three markets that each solve a piece and stop**:
AI tutoring (subject help, seat-priced, not Islamic, not compliance, not
continuity), Islamic homeschool programs (either full accredited schools on
tuition, or live-teacher services with the churn + cost problem), and waqf-tech
(fund transparency that stops at "where did the money go"). Nobody combines **pod
continuity + Islamic education + community-funded compliance**, delivered
free-to-low-cost to families. The Quebec Muslim homeschool population is real and
growing, and the compliance regime is specific enough that a generic tool doesn't
fit.

## The three adjacent markets

### 1. AI tutoring

| Product | What it is | Pricing | What it does NOT do |
|---|---|---|---|
| **Khanmigo** (Khan Academy) | Student-facing AI tutor that guides through problems | **$4/mo or $44/yr per family** (≤10 kids); **$15/student/yr for schools**; free for accredited teachers | No Islamic content; no compliance record; no volunteer/teacher continuity; seat/subscription priced (scales with users); not a pod model |
| **MagicSchool** | Teacher assistant — lesson planning, differentiation, admin | Per-teacher subscription | Not student-facing tutoring at all |
| **Amira** | Early-reading tutor (speech) | School contracts | Single subject; not homeschool-oriented; not Islamic |
| **Carnegie Learning MATHia** | Adaptive math courseware | District contracts | Single subject; district sales motion; not homeschool |

The K-12 AI-tutor market is ~**$2.75B in 2026** — crowded and growing. The common
thread: they tutor *subjects*, priced per seat, for schooled students. None
touches the homeschool-compliance, community-funding, or volunteer-continuity
problems.

### 2. Islamic homeschool programs & curriculum

| Product | Model | What it does NOT do |
|---|---|---|
| **Sahlah Academy** | Al-Azhar-certified, Cognia-accredited **full online Islamic school / homeschool program** | Tuition-funded accredited school; not a pod model; not Quebec-compliance-specific; not community-sustained |
| **Zaid Academy** | **Live, one-on-one, certified teachers** (Quran / Islamic Studies / Arabic) | The "hire a tutor" model — carries exactly the cost + churn problem Suffa targets; per-course pricing; no continuity system |
| **Allamah Education** | **Integrated curriculum** (academics through an Islamic lens), unit studies | Content, not a platform: no assessment/compliance pipeline, no funding model, no pods |
| **Noor Kids** | Islamic children's books + stories | Supplemental content, not schooling |
| **VRC / co-op curricular maps** | Suggested reading lists for co-ops & supplemental programs | A curriculum outline, not software or a service |

These are either **schools** (accredited, tuition, not community-run) or
**content** (no assessment, compliance, continuity, or funding). The live-teacher
services (Zaid) are the closest to the pod use-case and are precisely where the
churn-and-cost pain shows up.

### 3. Waqf-tech

| Product | What it is | Where it stops |
|---|---|---|
| **WaqfChain** (Finterra) | Ethereum + smart contracts for waqf asset management: transparent transactions, real-time asset tracking, automated reporting | Fund flow and governance. "Where did the money go" — not "what did it achieve" |
| **baraka.fund** | Automated, transparent endowment/waqf on blockchain; principal locked by smart contract | Same — locks the principal and shows transactions; no outcome linkage |

Both prove appetite for waqf transparency. Neither links a contribution to a
**learning outcome** — which is Suffa's waqf-to-outcome view (mocked in the demo,
`T21`).

### 4. Generic homeschool compliance / recordkeeping tools

Portfolio and progress-log apps exist, but they are **backward-looking record
storage** and are jurisdiction-generic. Quebec's regime (learning project, status
report, two progress bilans, an annual evaluation from a fixed set of four modes,
ministerial exams, a monitoring meeting — see
`docs/compliance/quebec-home-instruction.md`) is specific enough that families
assemble the evidence by hand. None of these tools produce a **forward-looking**
"on track / gap forming" read.

## The Quebec-specific need

- **~7,900** homeschooled children in Quebec (0.8% of school-age, growing since
  2019); true number likely higher given imperfect registration.
- **~421,710** Muslims in Quebec (2021 census, ~5% of the province), concentrated
  in Greater Montreal.
- Islamic homeschooling is a rising choice for Muslim families in the US, UK and
  Canada — "stepping away from expensive, rigid school systems" toward structured
  faith-centred education at home.
- The unmet combination for these families: **quality** (a parent can't teach
  every subject), **cost** (private Islamic school is ~$8–15K/child/yr,
  tuition-dependent), **compliance** (Quebec's evaluation requirements), and
  **socialisation** (homeschooling alone is isolating). Pods answer cost +
  socialisation; volunteer churn breaks the quality/continuity side; and no
  existing product ties the funding to the community.

## The gap Suffa fills

| Need | AI tutors | Islamic homeschool programs | Waqf-tech | Compliance tools | **Suffa** |
|---|---|---|---|---|---|
| Subject instruction that doesn't stop on churn | ✅ (tutoring) but no continuity | live-teacher = churn | — | — | ✅ AI carries it; briefed handoff |
| Islamic content (incl. Seerah) | ❌ | ✅ | — | — | ✅ + community-authored Seerah |
| Quebec compliance evidence, forward-looking | ❌ | partial (schools) | — | backward-looking only | ✅ living status + snapshot |
| Community funding, free-to-family | ❌ (seat pricing) | ❌ (tuition) | fund transparency only | — | ✅ waqf + flat fee + sadaqah |
| Contribution → learning outcome | — | — | ❌ (stops at fund flow) | — | ✅ (waqf-to-outcome) |
| Pod model (≤4, exemption-aligned) | ❌ | ❌ | — | — | ✅ central entity |

**The defensible claim:** the novelty is not any single feature — it is combining
**pod continuity + Islamic education + community-funded compliance** in a way
nobody has stitched together for this specific problem. The three sharpest
expressions — the Continuity Fingerprint (handoff as memory transfer), the living
compliance report (early-warning, not recordkeeping), and waqf-to-outcome linking
(outcomes, not just fund flow) — are each a place where the nearest competitor
stops.

## Open questions / gaps in this research

- No public per-student cost figure for Sahlah/Zaid was found — the ~$8–15K/yr
  Islamic-school figure is a general private-school range, not sourced to a
  specific Quebec Islamic school; confirm with a local school before quoting it
  on stage.
- Whether any Quebec Muslim homeschool co-op already runs a pod model informally
  (AQED / local masjids) — worth a direct conversation; it would be a partner,
  not a competitor.

## Sources

1. *Best AI Tutoring Software for School: 2026 Comparison* — https://www.thirdrocktechkno.com/blog/ai-tutoring-software-for-school/ — accessed 2026-09-06
2. *How Much Does Khanmigo Cost? Pricing for Teachers and Schools in 2026* — https://www.edusageai.com/blogs/how-much-does-khanmigo-cost-pricing-for-teachers-and-schools-in-2026 — accessed 2026-09-06
3. *7 Best Khanmigo Alternatives in 2026* (Kuraplan) — https://www.kuraplan.com/blog/khanmigo-alternatives — accessed 2026-09-06
4. Sahlah Academy — https://www.sahlah.net/k12-online — accessed 2026-09-06
5. Zaid Academy — https://zaidacademy.com/islamic-homeschooling-curriculum/ — accessed 2026-09-06
6. Allamah Education — https://www.allamaheducation.com/ — accessed 2026-09-06
7. baraka.fund — https://baraka.fund/ — accessed 2026-09-06
8. FINTERRA — *WaqfChain a Tool for Transparency Administration* — https://finterra.org/2023/04/13/waqfchain-a-tool-for-transparency-administration/ — accessed 2026-09-06
9. Quebec homeschool + census figures — see `docs/research/model-economics.md`
