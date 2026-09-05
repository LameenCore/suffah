---
id: T18
title: Continuity Fingerprint — AI volunteer-handoff briefing
phase: 7
status: doing
owner: https://claude.ai/code/session_01SKEypdSNQf7yjj5E411g4B
claimed: 2026-09-05T00:00:00Z
updated: 2026-09-05
depends_on: [T07, T11]
tier: 1
build_or_mock: build
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
- [ ] pod_session_notes table + a way to add a note (admin or volunteer view)
- [ ] lib/ai/continuity.ts generates + persists a pod briefing from progress + notes
- [ ] Admin continuity view shows the briefing for a pod
- [ ] Briefing is persisted, not regenerated per view

## Notes (owner appends)
