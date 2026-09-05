# BOARD — Suffa progress snapshot

**Derived from `progress/tasks/`. Not authoritative. Regenerate after any claim/finish.**
Last regenerated: 2026-09-05 (T23 done; T18/T21/T24 done)

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
| T09 | 3 | todo  | — | Term exam variant (timed) + term_exam_results |
| T10 | 4 | done  | — | Parent dashboard — progress + results per course |
| T11 | 4 | done  | — | Admin dashboard — pods, assignment, continuity view |
| T12 | 4 | todo  | — | Compliance report generation + exportable view |
| T13 | 5 | done  | — | waqf_ledger table + mock entries |
| T14 | 5 | done  | — | Admin ledger view + family fee status |
| T15 | 6 | done  | — | Volunteer onboarding form + churn log |
| T16 | 6 | todo  | — | Regulation-verification disclaimers |
| T17 | 6 | todo  | — | Seed data cleanup for demo walkthrough |
| T18 | 7 | done  | — | Continuity Fingerprint — AI volunteer-handoff briefing |
| T19 | 7 | todo  | — | Live "empty seat" handoff simulation (demo feature) |
| T20 | 7 | todo  | — | Compliance report as a living document (early-warning) |
| T21 | 7 | done  | — | Waqf-to-outcome linking (donor sees learning) |
| T22 | 7 | todo  | — | Multi-generational knowledge sourcing for Seerah content |
| T23 | 7 | done  | — | Pod "Barakah meter" — character/community indicators |
| T24 | 7 | done  | — | Waqf principal "never touched" visual |

## Next up (deps met, unclaimed)
- **T09** — Term exam variant (timed) + term_exam_results (dep T08 done)
- **T19** — Live "empty seat" handoff simulation (dep T18 done) — demo centrepiece
- **T16** — regulation disclaimers (no deps, can run anytime)
- **T22** — Seerah community sourcing (dep T05 done, mock/text)
- blocked: T12 (needs T09), T17 (needs T12), T20 (needs T12)

## Phase 7 — differentiators (see PRD §5.4)
Build order: T18 → T19 (unique IP, demoable), then T20. T21/T22 as mocked pitch screens.
T18 unblocks T19. T20 depends on T12.

## Legend
todo = free to claim · doing = owned now · blocked = see task's `blocker:` · done = see task's `outcome:`
