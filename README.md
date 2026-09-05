# Suffa

AI-sustained, pod-based homeschool platform for Quebec Muslim families. Three
dashboards over one Next.js app: **Student playground** (AI-taught curriculum),
**Parent** (read-only monitoring), **Masjid Admin** (pods, volunteers, compliance,
waqf ledger).

Read `CLAUDE.md` → `PRD.md` → `ARCHITECTURE.md` → `DATA_MODEL.md` → `TASKS.md`
before contributing.

## Stack

Next.js 16 (App Router, TS, Tailwind v4) · Supabase (Postgres + Auth) · Anthropic API.

## Local setup

The project runs **locally first** (`npm run dev`). Vercel is only for later.
The database is hosted Supabase (Postgres), but everything else — the app, the AI
calls, the content-generation and migration scripts — runs on your machine.

```bash
npm install
cp .env.example .env.local        # then fill in the values below
npm run migrate                   # apply supabase/migrations/*.sql
npm run seed                      # load the demo masjid / pod / courses
npm run gen:lessons               # generate + persist the 3 demo lessons (Anthropic)
npm run gen:checkpoints           # then the checkpoints
npm run gen:assessments           # then the unit assessments
npm run gen:exams                 # then the term exams
npm run seed:continuity           # demo session notes + first pod handoff briefing
npm run dev                       # http://localhost:3000
```

`.env.local` keys:

| key | where |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API (`https://<ref>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | same page |
| `SUPABASE_DB_URL` | Project Settings → Database → **Connection string → URI**. Use the **pooler** host (`aws-*-<region>.pooler.supabase.com`, user `postgres.<ref>`), not `db.<ref>.supabase.co` (that one is IPv6-only). Only `migrate` / `seed` use it. |
| `ANTHROPIC_API_KEY` | console.anthropic.com — needed for the `gen:*` scripts and live generation |

The app builds and runs without any credentials, but the dashboards need the DB +
seed data to show anything. The landing page is a dev role picker that drops a
`suffa-dev-role` cookie and enters the chosen dashboard (`NEXT_PUBLIC_SUFFA_DEV_ROLE`
skips the picker). Real Supabase Auth replaces this later — see `lib/auth/`.

## Database

- **Migrations:** `supabase/migrations/*.sql`, applied in order by `npm run migrate`
  (tracks `schema_migrations`; `0001` is auto-baselined if the core schema is already
  present). You can also paste them into the Supabase SQL editor.
- **Seed:** `npm run seed` ports `supabase/seed.sql` through the service-role client
  (idempotent — wipes the demo masjid via FK cascade, re-inserts).
- **Generated content** (`pathway_nodes.lesson_content` / `.checkpoint_content`,
  `units.assessment_content`) is persisted once and not regenerated on view. Re-run a
  `gen:*` script with `-- --force` to regenerate.

## Layout

```
app/
  admin/ parent/ student/   # the three dashboards (route-level role guards)
  api/                      # REST routes + AI generation endpoints (Phase 2+)
lib/
  ai/    Claude wrapper — all LLM calls route through here
  db/    Supabase clients + query helpers (masjid_id scoping)
  auth/  role-based guards (admin / parent / student)
components/                 # shared UI
```

## Build order

`TASKS.md` — build in phases, each phase leaves something demoable. Commit at every
completed checklist item (`.claude/skills/git-workflow.md`... currently `git-workflow.md`).
