---
id: T41
title: Content moderation + child safety for UGC
phase: 10
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-06T01:00:00Z
updated: 2026-09-06
completed: 2026-09-06T00:00:00Z
outcome: >
  Built with T47. lib/moderation.ts screens every post pre-publish: a short
  profanity list + email/phone/URL/address patterns -> the post is HELD (visible
  only to author + adults, PII masked to the author), never auto-published or
  auto-deleted. Report-a-post holds a visible post immediately. /admin/board is
  the moderation queue (flag reason, pod, author, report count) with release /
  hide, both audit-logged (board.post_released / board.post_hidden) + a held-count
  nav badge. docs/moderation/policy.md documents safety-by-design, retention, and
  takedown. Verified live: held on profanity+PII, masked, queue, release/hide,
  report flow.
commits: PLACEHOLDER41
depends_on: [T47]
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
The moment pods get a discussion board, minors are producing content visible to others. That
needs safety by design.

## Done when
- [x] Volunteer/admin moderation queue; report-a-post; profanity + PII auto-flagging before
      publish
- [x] No DMs between students; posts scoped to the pod; adults (volunteer/admin) always
      visible in the thread
- [x] Retention + takedown policy documented

## Notes (owner appends)
