# CLAUDE.md — Suffa

This file is the entry point for Claude Code (or any AI coding assistant) working on this repo. Read this first, then `PRD.md`, then `docs/ARCHITECTURE.md` and `docs/DATA_MODEL.md` before writing code.

## What this project is

**Suffa** is an AI-sustained, pod-based homeschool platform for Quebec Muslim families, built for a hackathon under the "At-Home Education" challenge brief. It is a **business-model deliverable first, software demo second** — the build should prove one working core loop (AI-taught lesson → checkpoint → unit assessment → auto-generated compliance report), not a full production system.

**Name origin:** Suffa refers to the Ashab al-Suffa ("People of the Platform"), companions of the Prophet Muhammad ﷺ who lived at the mosque in Medina and were sustained by the community so they could dedicate themselves fully to learning. The platform's funding model (waqf-sustained, community-supported, free to families) deliberately mirrors that precedent.

## Core concept (one paragraph)

Children are placed in small pods (max 4, matching Quebec's home-instruction exemption threshold). AI delivers the actual curriculum — lessons, checkpoints, unit assessments, term exams — continuously through a self-paced playground, so learning never stops even when a volunteer leaves (high volunteer churn is the core operational pain point this solves). Community volunteers provide live enrichment and socialization, not primary instruction. Parents monitor via a lightweight dashboard. The masjid administers pods, volunteers, and compliance reporting through an admin dashboard. The whole thing is funded by a waqf endowment (permanent principal, only returns spent) + a small flat permanent parent fee + sadaqah-funded scholarships — not tuition-dependent.

## Three dashboards (the whole product surface)

1. **Masjid Admin** — volunteer onboarding/vetting, pod assignment (hard cap 4 students/pod), compliance report generation, waqf/donation ledger (transparency view), continuity handoff view
2. **Parent** — read-only progress view per course, checkpoint/assessment/exam results, pod schedule, fee/sponsorship status
3. **Student (Playground)** — the actual AI-taught learning surface: pathways, lessons, three-tier assessments, per course

## Demo scope (hackathon — do not overbuild)

- **One grade band**: Secondary 1 equivalent (~12 years old), even though the target range is 10–13
- **Three courses**: Math (maps to real Quebec curriculum — this is the compliance-credibility subject), Seerah (community-specific, no external curriculum body — proves the model works for content no vendor would build), AI literacy (meta-narrative reinforcement)
- **One full unit per course** is sufficient — do not build full-year curriculum coverage
- **Assessment grading stays objective** (MCQ, short numeric/short-answer) for demo reliability — no rubric-based grading of open-ended answers in this scope
- **Funding ledger, volunteer vetting, and legal compliance logic are all mocked/simulated data** — do not build real payment processing, real background-check integration, or real multi-jurisdiction legal logic
- See `PRD.md` Section 6 ("Non-Goals") before adding any feature not explicitly listed there

## Tech stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind
- **Backend:** Next.js API routes or a lightweight FastAPI service if the AI-grading/assessment logic benefits from Python — decide based on where the LLM calls live (see `docs/ARCHITECTURE.md`)
- **Database:** PostgreSQL (Supabase is fine for hackathon speed — gives auth + Postgres + storage in one)
- **AI:** Anthropic API (Claude) for lesson generation, checkpoint/exam question generation, and objective-answer grading
- **Auth:** Role-based — Admin / Parent / Student, scoped per masjid/tenant (even if only one masjid exists in the demo, model it as multi-tenant from the start — see `docs/DATA_MODEL.md`)
- **Hosting:** Vercel (frontend) + Supabase (DB/auth) is the fastest path for a hackathon timeline

## Working conventions

- Keep the three dashboards as separate route groups (`/admin`, `/parent`, `/student`) with shared components, not three separate apps
- Every AI-generated lesson, checkpoint, and exam question must be persisted (not regenerated on every view) — a pod's continuity depends on stable, referenceable content
- Treat "pod" as the central entity everything else hangs off — course pathways are assigned to pods, not directly to students, since a pod moves through curriculum together (see `docs/DATA_MODEL.md`)
- Flag any legal/compliance-adjacent copy (exemption thresholds, evaluation formats) in the UI with a visible "verify with current regulation" note — this is stated as a hard constraint in the PRD, not optional polish
- Commit early, commit often — for a hackathon judge/demo flow, a working `main` branch at every checkpoint matters more than clean history

## Build order

See `TASKS.md` for the recommended build sequence given limited time. Read it before starting.

## Files in this repo

- `PRD.md` — full product requirements
- `docs/ARCHITECTURE.md` — system design, folder structure, where AI calls happen
- `docs/DATA_MODEL.md` — database schema and entity relationships
- `TASKS.md` — build-order checklist for the hackathon window
- `.claude/skills/` — project-specific skills for API design, security review, and git workflow, adapted from prior project conventions
- `AGENTS.md` — Next.js 16 agent rules (auto-maintained by `next dev`); this repo runs **Next.js 16**, which has breaking changes vs. older versions — consult `node_modules/next/dist/docs/` before writing framework code

@AGENTS.md
