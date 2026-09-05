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

```bash
npm install
cp .env.example .env.local   # fill in when Supabase / Anthropic are wired up
npm run dev                  # http://localhost:3000
```

The app builds and runs without any credentials — the landing page is a dev role
picker that drops a `suffa-dev-role` cookie and enters the chosen dashboard. Real
Supabase Auth replaces this (see `lib/auth/`).

## Database

Schema lives in `supabase/migrations/0001_init.sql` — paste into the Supabase SQL
editor or run `supabase db push`.

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
