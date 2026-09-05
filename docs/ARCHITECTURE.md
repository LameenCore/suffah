# Architecture - Suffa

> This is the original plan. For the **built** system — a current diagram, where
> tenancy is enforced, each choice justified against its rejected alternative, and
> the known tradeoffs with the task that closes each — see
> [`architecture-rationale.md`](./architecture-rationale.md).

## System shape

Single Next.js app, three route groups sharing one backend and one database. Not three separate apps - the dashboards differ in UI/permissions, not in underlying system.

```
suffa/
├── app/
│   ├── admin/           # Masjid Admin dashboard routes
│   ├── parent/          # Parent dashboard routes
│   ├── student/         # Student playground routes
│   ├── api/
│   │   ├── lessons/     # AI lesson generation + retrieval
│   │   ├── checkpoints/ # checkpoint question generation + grading
│   │   ├── assessments/ # unit assessment + term exam generation + grading
│   │   ├── pods/        # pod CRUD, assignment logic
│   │   ├── reports/     # compliance report generation
│   │   └── ledger/      # waqf/donation mock ledger
│   └── layout.tsx
├── lib/
│   ├── ai/              # Claude API wrapper - all LLM calls go through here
│   ├── db/              # Postgres client + query helpers
│   └── auth/            # role-based auth helpers (admin/parent/student)
├── components/          # shared UI components across dashboards
├── docs/
├── .claude/skills/
├── CLAUDE.md
├── PRD.md
└── TASKS.md
```

## Where AI calls happen (this is the core of the product)

All LLM calls route through `lib/ai/` - do not call the Anthropic API directly from route handlers. This keeps prompt templates centralized and swappable.

**Three AI call types, matching the three-tier assessment structure:**

1. **Lesson generation** (`lib/ai/lesson.ts`) - given a course + pathway node, generate the lesson content and interactive practice. Persist the output; do not regenerate on every view (continuity depends on stable content - see PRD constraint).
2. **Checkpoint generation + grading** (`lib/ai/checkpoint.ts`) - generate a short check question per lesson node; grade the student's objective answer; return pass/fail + remedial branch decision.
3. **Assessment generation + grading** (`lib/ai/assessment.ts`) - generate unit assessments (cumulative, several nodes) and term exams (timed, no remedial branching); grade objectively (MCQ / short numeric / short-answer matching); persist results as compliance-relevant records.

**Important:** grading in this scope is objective-format only (see PRD Non-Goals). Do not build subjective/rubric grading for the hackathon - it adds risk without adding demo value.

## Data flow (one full loop, this is what the demo shows)

```
Student opens playground → lesson pulled/generated for their pod's current node
  → student completes lesson → checkpoint generated → student answers
  → checkpoint graded → result persisted
  → [after N checkpoints] unit assessment generated → student completes → graded → persisted
  → results surface in:
      - Parent dashboard (progress + report view)
      - Admin dashboard (compliance report + pod continuity view)
```

## Multi-tenancy

Model every table with a `masjid_id` from day one, even though the demo only has one masjid. This costs almost nothing now and avoids a schema rewrite if the model needs to show multi-community scalability in Q&A.

## Auth / roles

Three roles: `admin`, `parent`, `student`. Simplest viable approach for a hackathon: Supabase Auth with a `role` column on the user record, route-level guards per dashboard. Do not build a permissions matrix beyond these three roles.

## What NOT to build (see PRD Non-Goals for full list)

- No real payment/donation processing - `ledger` API returns/accepts mock data only
- No real background-check integration for volunteers - a status enum field is sufficient
- No multi-jurisdiction legal engine - Quebec rules only, hardcoded, with a UI disclaimer
