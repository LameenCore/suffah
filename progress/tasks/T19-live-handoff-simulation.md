---
id: T19
title: Live "empty seat" handoff simulation (demo feature)
phase: 7
status: todo
owner: —
claimed: —
updated: 2026-09-05
depends_on: [T18]
tier: 3
build_or_mock: build
---

## Why
Performs the core differentiator instead of describing it. Much stronger in a
5-minute pitch than a slide: kill the volunteer mid-session, show the pod's lesson
continuing uninterrupted, then show the next volunteer's handoff briefing generate live.

## Goal
A scripted demo flow (a button or a short guided sequence) that:
1. Shows a pod in a live session with a volunteer assigned.
2. "Volunteer goes offline" — mark the volunteer inactive / unassign; the student
   playground keeps working (lesson + checkpoint still available — already true, just
   make it visible/narrated).
3. Admin assigns a new volunteer → the T18 continuity briefing generates on screen.

## Approach
- Mostly presentation glue over T18 + existing pod/volunteer reassignment (T11).
- A `/admin` (or `/demo`) sequence with clear step affordances so it's repeatable on
  stage. Keep it a real path through real data, not a fake animation.
- Add a "restore demo state" action so it can be re-run between pitch practice.

## Done when
- [ ] A repeatable on-stage flow: volunteer offline → pod unaffected → reassign →
      briefing appears
- [ ] Uses real reassignment + real T18 briefing, not a mock
- [ ] One-click reset to re-run

## Notes (owner appends)
