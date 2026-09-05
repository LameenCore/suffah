---
id: T18
title: Continuity Fingerprint — AI volunteer-handoff briefing
phase: 7
status: done
owner: https://claude.ai/code/session_01SKEypdSNQf7yjj5E411g4B
claimed: 2026-09-05T00:00:00Z
updated: 2026-09-05
completed: 2026-09-05T00:00:00Z
depends_on: [T07, T11]
tier: 1
build_or_mock: build
outcome: pod_session_notes + pod_briefings (migration 0006). lib/ai/continuity.ts
  generates + persists a structured AI handoff briefing from pod progress + checkpoint
  history + session notes; deterministic fallback. /admin/continuity view + note form,
  POST /api/continuity/briefing, npm run seed:continuity. checkpoint.ts writes a system
  note on repeated misses. Verified: briefing synthesises notes into per-course status +
  per-student observations + day-one actions.
commits: 25f7f8e, <t18>
---

## Why (from competitive research)
AI tutoring is crowded; the moat is the *combination* — pod continuity + Islamic
education + community-funded compliance. This feature is the sharpest piece of that:
turn volunteer churn from a data-loss event into a knowledge-transfer event. No tutoring
platform treats teacher/volunteer handoff as pedagogical memory transfer.

## Goal
When a volunteer is (re)assigned, the incoming volunteer sees a short AI-generated
briefing about *how* the pod has been learning — not just "Node 4 of Unit 2". e.g.
"This pod moved quickly through integer addition but three attempts on the order-of-
operations checkpoint; Maryam tends to rush and miss signs; the group does best with
number-line visuals."

## Approach (hackathon scope)
- New table `pod_session_notes` (pod_id, author volunteer/system, node_id nullable,
  note text, created_at) — volunteers jot 1-line observations after a live session;
  the playground can also write terse system notes on notable events (checkpoint
  failed twice, remedial branch taken).
- `lib/ai/continuity.ts` — `generatePodBriefing(podId, courseId?)`: feeds the model
  the pod's per-course position, per-student checkpoint/assessment history, and the
  recent `pod_session_notes`; returns a compressed narrative briefing (persist it as
  `pod_briefings` keyed by pod+generatedAt so it's referenceable, not regenerated on
  every view).
- Surface on the Admin continuity handoff view (extends T11): "Generate handoff
  briefing" button per pod → shows the briefing; regenerate on demand.

## Done when
- [x] pod_session_notes table + a way to add a note (admin or volunteer view)
- [x] lib/ai/continuity.ts generates + persists a pod briefing from progress + notes
- [x] Admin continuity view shows the briefing for a pod
- [x] Briefing is persisted, not regenerated per view

## Notes (owner appends)
- Migration is **0006** (renumbered from 0005 to avoid colliding with T10's
  0005_parent_children.sql).
- Briefing shape: `{ headline, perCourse: [{course, position, status, note}],
  students: [{name, observation}], watchFor: string[] }`. `PodBriefing` in lib/ai/continuity.ts.
- Signals fed to the model: pod + students + per-course node position + per-(student,node)
  checkpoint attempts/passes + unit_assessment_results + recent pod_session_notes.
- `checkpoint.ts` auto-writes a `system` session note when a student misses a node's
  checkpoint 2+ times — makes the fingerprint reflect real struggle without manual notes.
- **T19 (live handoff simulation) builds directly on this** — a repeatable
  volunteer-offline → reassign → briefing-generates flow.
- Ready-made demo data: `npm run seed:continuity` (5 notes + first briefing for Pod Al-Farabi).
