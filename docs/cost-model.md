# Cost of running Suffa, and why it's sustainable

_Task T68. Hardens `docs/pitch.md` → Unit economics into numbers a judge can push
on. AI costs are estimated from the actual `gen:*` runs at Claude Sonnet 5 rates
($2 / 1M input, $10 / 1M output). Infra and stipend figures are labelled
estimates, not quotes._

## The one-line version

The marginal cost of another student is ≈ **$0** — instruction content is
generated **once per masjid and persisted**, and grading is deterministic code.
The only recurring cost that matters is an **optional** part-time coordinator
stipend. A single founding waqf of **~$75–165K** (a normal masjid fundraising
drive) covers a masjid's pods in perpetuity at a conservative 4% draw.

## AI cost — measured

Per model call (structured output via `messages.parse`, observed sizes):

| Call | ~input tok | ~output tok | Cost |
|---|---|---|---|
| Lesson | 1,500 | 2,500 | ~$0.028 |
| Checkpoint | 2,000 | 1,200 | ~$0.016 |
| Unit assessment | 3,000 | 2,000 | ~$0.026 |
| Term exam | 4,000 | 3,000 | ~$0.038 |
| Continuity briefing | 3,000 | 1,500 | ~$0.021 |

**One full curriculum unit, 3 courses** (9 lesson nodes + 9 checkpoints + 3 unit
assessments + 3 term exams — the exact content the demo generates):

- 9 × $0.028 + 9 × $0.016 + 3 × $0.026 + 3 × $0.038 ≈ **$0.58, one time, per masjid.**

That content is persisted and served to every student in every pod, every term.
Adding the 4th student to a pod costs **nothing**.

Ongoing AI cost for a masjid, per year:

| Item | Estimate |
|---|---|
| Content updates (say regenerate ~20% of nodes per term × 3 terms) | ~$0.40 |
| Continuity briefings (~4 volunteer handoffs/yr) | ~$0.08 |
| Grading | **$0** (deterministic code, no model call) |
| **AI total / masjid / year** | **≈ $1** |

The one place marginal cost *would* grow is the roadmapped AI lesson tutor
(`T45`) — per-student, but bounded (context = one lesson) and not built yet.

## Infrastructure — estimates

| | Single-masjid pilot | Shared across ~10 masjids (per masjid) |
|---|---|---|
| Supabase (Free tier for a pilot; Pro $25/mo when PITR is needed — see `T57`) | $0–300 / yr | ~$30 / yr |
| Vercel (Hobby free; Pro $20/mo if needed) | $0–240 / yr | ~$25 / yr |
| Transactional email (`T58`, Resend free tier covers a pilot) | $0 | $0 |
| **Infra total** | **$0–540 / yr** | **~$55 / yr** |

The schema is multi-tenant from day one (`masjid_id` on every table), so one
Supabase project + one Vercel deployment can host many masjids — infra is a
rounding error at any real scale.

## Human cost

- **Volunteers**: unpaid — they're the community half of the model.
- **Community coordinator**: the only real recurring cost, and it's a *choice*.
  Someone administers pods, onboards volunteers, and is the compliance liaison
  for the masjid's families. Assume a part-time stipend of **$3,000–6,000 / yr**;
  a fully-volunteer masjid pays $0.

## Per-masjid annual operating cost

| Scenario | AI | Infra | Coordinator | **Total / yr** | Endowment @ 4% draw to cover it |
|---|---|---|---|---|---|
| **Lean** — volunteer coordinator, shared infra | ~$1 | ~$55 | $0 | **~$56** | the flat parent fee alone covers it |
| **Base** — part-time stipend, shared infra | ~$1 | ~$55 | $4,000 | **~$4,056** | **~$101,000** |
| **Stress** — AI prices 3×, 40 students not 12, own infra, higher stipend | ~$3 | ~$540 | $6,000 | **~$6,543** | **~$164,000** |

Note the stress column: going from 12 students to 40 barely moves AI or infra —
the content is shared — it moves the **coordinator workload**, which is why the
stipend is the lever.

## Break-even

- A **$100,000** founding waqf at a **4%** sustainable draw yields **$4,000/year**
  — covers the Base scenario outright.
- The **flat parent fee** (say $150–250/family/year, permanent, the same for
  everyone) covers the buffer and any coordinator gap: 12 families × $200 =
  $2,400/yr.
- **Sadaqah** funds the fee for families who can't pay it — a separate stream
  that never touches the principal.

So one masjid needs **one endowment drive of ~$75–165K** and then its pods run
indefinitely. Masjids routinely raise $1–5M for buildings; this is a fraction of
that, for a permanent asset.

## Why it's sustainable (the 3 sentences)

1. The **marginal cost of another student is ≈ zero** because instruction content
   is generated once and grading is code — cost doesn't scale with enrollment the
   way tuition-funded schooling does.
2. The recurring cost is dominated by an **optional** part-time coordinator
   stipend, and a **single founding endowment of ~$75–165K** — a normal masjid
   fundraising drive — covers it in perpetuity at a conservative 4% draw.
3. It is **not tuition-dependent**, so it doesn't need scale to break even and
   doesn't collapse if a few families leave.

## Assumptions a judge can challenge (and our answer)

- **"Your AI token estimates are guesses."** They're derived from the observed
  sizes of the content the demo actually generated; the *structure* (persist
  once, code-grade) is what makes the number small, and that's verifiable in the
  repo, not an estimate.
- **"$4K/yr coordinator is too low."** It's a part-time stipend for one masjid;
  the Lean scenario ($0, volunteer) is also viable and many masjids would run it
  that way. The model doesn't break if it's $10K — that's a ~$250K endowment.
- **"Endowment fundraising is hard."** It's the same act masjids already perform
  for buildings, and unlike a building it produces recurring educational capacity
  rather than a maintenance liability.
- **"What if Anthropic 10×s prices?"** AI is ~$1/masjid/year. 10× is ~$10.
  Immaterial. The model's cost risk is the coordinator, not the model.
