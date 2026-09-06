---
id: T47
title: Pod discussion / Q&A board
phase: 11
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-06T01:00:00Z
updated: 2026-09-06
completed: 2026-09-06T00:00:00Z
outcome: >
  Per-pod threaded Q&A board. migration 0023 pod_board_posts (thread_id self-ref,
  one level deep; RLS read scoped to the caller's masjid) + pod_board_reports.
  lib/db/board-queries.ts: listPodThreads / getThread / createPost / reportPost /
  moderatePost / listModerationQueue, all pod + masjid scoped. Students post to
  /student/board (own pod only), volunteers to /volunteer/board (pods they
  cover), admins moderate at /admin/board. Adults see every post incl. held ones
  and are in every thread; no cross-pod visibility; no DMs anywhere. A student
  answering a *peer's* question drops one "cooperation" barakah note per day
  (feeds the "helps others" indicator). Verified live end-to-end.
commits: PLACEHOLDER47
depends_on: [T32]
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
The pod is a social unit; right now it has no async space. A per-pod board for questions and
peer help, adult-supervised.

## Done when
- [x] Per-pod threaded board; students post questions, peers + the volunteer answer
- [x] Volunteer/admin always in the thread; no cross-pod visibility; see T41 for moderation
- [x] Activity feeds the Barakah 'helps others' indicator

## Notes (owner appends)
