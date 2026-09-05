# BOARD — Suffa progress snapshot

**Derived from `progress/tasks/`. Not authoritative. Regenerate after any claim/finish.**
Last regenerated: 2026-09-05 (T12 + T20 done — compliance report; only T16, T17 left)

| id  | phase | status | owner | title |
|-----|-------|--------|-------|-------|
| T01 | 1 | done  | — | Next.js + Tailwind scaffold |
| T02 | 1 | done  | — | Supabase project — Postgres + Auth |
| T03 | 1 | done  | — | Core schema migration |
| T04 | 1 | done  | — | Three route groups + role-gated auth |
| T05 | 2 | done  | — | lib/ai/lesson.ts — generate + persist lesson nodes |
| T06 | 2 | done  | — | Student playground — render lesson, mark complete |
| T07 | 2 | done  | — | lib/ai/checkpoint.ts — checkpoint gen/grade, gate progression |
| T08 | 3 | done  | — | lib/ai/assessment.ts — unit assessment |
| T09 | 3 | done  | — | Term exam variant (timed) + term_exam_results |
| T10 | 4 | done  | — | Parent dashboard — progress + results per course |
| T11 | 4 | done  | — | Admin dashboard — pods, assignment, continuity view |
| T12 | 4 | done  | — | Compliance report generation + exportable view |
| T13 | 5 | done  | — | waqf_ledger table + mock entries |
| T14 | 5 | done  | — | Admin ledger view + family fee status |
| T15 | 6 | done  | — | Volunteer onboarding form + churn log |
| T16 | 6 | todo  | — | Regulation-verification disclaimers |
| T17 | 6 | todo  | — | Seed data cleanup for demo walkthrough |
| T18 | 7 | done  | — | Continuity Fingerprint — AI volunteer-handoff briefing |
| T19 | 7 | done  | — | Live "empty seat" handoff simulation (demo feature) |
| T20 | 7 | done  | — | Compliance report as a living document (early-warning) |
| T21 | 7 | done  | — | Waqf-to-outcome linking (donor sees learning) |
| T22 | 7 | done  | — | Multi-generational knowledge sourcing for Seerah content |
| T23 | 7 | done  | — | Pod "Barakah meter" — character/community indicators |
| T24 | 7 | done  | — | Waqf principal "never touched" visual |

## Next up (deps met, unclaimed)
- **T16** — regulation-verification disclaimers sweep (no deps)
- **T17** — seed/demo cleanup for a smooth walkthrough (deps met — T12 done)

Everything else is done. T16 + T17 are the last two — both polish.
Demo content scripts: `npm run seed && seed:continuity && seed:progress && gen:lessons && gen:checkpoints && gen:assessments && gen:exams`.

## Legend
todo = free to claim · doing = owned now · blocked = see task's `blocker:` · done = see task's `outcome:`
