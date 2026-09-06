---
id: T60
title: Accessibility pass to WCAG 2.2 AA
phase: 13
status: doing
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-06T02:30:00Z
updated: 2026-09-05
depends_on: [T25]
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
Legal (accessibility law) and right. The T25 redesign should bake it in; this is the audit +
fixes across the whole app.

## Done when
- [ ] Keyboard-only path through every flow; visible focus; skip links; correct landmarks +
      headings
- [ ] Screen-reader pass (NVDA/VoiceOver) on the 5 demo screens; form labels + error
      announcement; live regions for async updates
- [ ] Contrast >= AA in both themes; respects prefers-reduced-motion; automated axe check in
      CI

## Notes (owner appends)
