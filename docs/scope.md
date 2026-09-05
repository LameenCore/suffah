# Scope — what Suffa solves, and what it doesn't (yet)

_Task T67. Read in 60 seconds._

## The problem, in one sentence

Quebec Muslim families who homeschool in small community pods lose continuity of
instruction every time a volunteer teacher leaves — and still have to produce a
Quebec-compliant evaluation record by hand.

## The slice we solve, end to end

**One pod, one grade band (Secondary 1 / ~12 y.o.), three courses (Math, Seerah,
AI literacy), one unit each** — the whole loop works against a live database and
the real Anthropic API:

1. The student opens the playground → the AI-generated lesson for the pod's
   current node (generated once, persisted) → they complete it.
2. A checkpoint is generated and **graded by code** (objective formats only) →
   passing advances the pod to the next node.
3. Results roll up into a **living compliance status** per course
   ("on track / watch / gap forming") and an exportable snapshot.
4. When a volunteer leaves, the AI writes a **handoff briefing** from the pod's
   progress + session notes so the next volunteer picks up mid-stream.
5. The waqf ledger shows the endowment principal locked and only its returns
   spent, with a contribution traced to a pod's actual unit completion.

Each step maps to a step of the demo script (`docs/qa-prep.md` → Demo &
functionality) — "solved" is demonstrable, not asserted.

## Mocked for the demo (named honestly)

| Area | State |
|---|---|
| Funding ledger entries | Seeded mock data — no payment rail |
| Volunteer vetting | A status field, not a background-check integration |
| Sponsorship / donor identity (waqf-to-outcome view) | Mock mapping; the outcomes it shows are real |
| Family fee status | Seeded |
| Seerah community sourcing | Real pipeline (text notes fold into a new lesson version); voice capture is not built |

Auth is real (Supabase Auth, `/login` + `/signup`, three seeded demo accounts);
the "try the demo" buttons use a dev cookie for a fast path.

## Deliberately out of scope (PRD §6)

- Full curriculum coverage beyond one unit per course
- Rubric / subjective AI grading (objective formats only)
- Real payment or donation processing
- Real volunteer background-check integration
- Multi-jurisdiction legal logic — Quebec only
- Full 10–13 grade-band coverage — the demo is one grade level
- On-chain / blockchain waqf ledger

## Roadmapped, not in the demo

Real production auth hardening (RLS), Quebec Law 25 + parental consent, French
localisation, accessibility to WCAG 2.2 AA, a Canadian-region database, and the
path to multi-masjid — all in `docs/roadmap.md` with a suggested pilot order.
