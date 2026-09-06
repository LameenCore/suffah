---
id: T66
title: Cognitive-accessibility 'simple mode' for the playground
phase: 13
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-06T03:00:00Z
updated: 2026-09-06
completed: 2026-09-06T00:00:00Z
outcome: >
  migration 0026 users.simple_mode + lib/simple-mode.ts (suffa-simple cookie ->
  users.simple_mode -> false, mirrors locale). Student layout resolves it and
  passes simple to DashboardChrome, which sets data-simple on the chrome root.
  globals.css [data-simple]: larger type (1.19rem, bigger h1/h2), 1.7 line-height,
  roomier spacing, decoration (.geo-field / [data-decor]) + motion off, and
  [data-simple-hide] panels removed — the tutor panel, the offline "Download"
  control, the term-exam timer display, the home mascot + flourish. A "Simple
  view" toggle in the student sidebar footer (cookie + refresh). Parents set the
  persisted per-child default on /parent/consent (setSimpleModeAction, audited,
  wrong-masjid guarded). Same lessons + assessments underneath — presentation
  only. Verified: data-simple appears only with the cookie/pref; persistence +
  guard tested; build + 68 tests + eslint + check:i18n (526) green.
commits: 2162b7f
depends_on: [T25, T60]
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
The target age is 10-13 with a range of needs. A lower-load presentation of the student
surface helps some learners and no one is harmed by it.

## Done when
- [x] Toggle -> larger type, reduced motion, no timer shown, decoration + secondary panels hidden. [~] "one thing on screen at a time" = the spacing/hiding pass; lesson pagination + full plain-language microcopy rewrite are follow-on
- [x] Persists per student (users.simple_mode); parent sets the default on /parent/consent. [~] volunteer default = follow-on
- [x] Same content + assessments underneath — the changes are CSS + element hiding only

## Notes (owner appends)
