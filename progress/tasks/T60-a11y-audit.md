---
id: T60
title: Accessibility pass to WCAG 2.2 AA
phase: 13
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-06T02:30:00Z
updated: 2026-09-06
completed: 2026-09-06T00:00:00Z
outcome: >
  Everything that could be fixed without a screen reader is done + an automated
  gate is in place. Skip link (components/SkipLink.tsx) + <main id tabIndex=-1> on
  every dashboard and the two long public pages; <nav aria-label> on the sidebar.
  Mobile drawer: role=dialog + aria-modal + name, focus trap, Escape to close,
  body scroll lock, focus returns to the trigger (aria-expanded/haspopup on it).
  @media (prefers-reduced-motion: reduce) in globals.css. Form label associations
  fixed (PodCard, VolunteerManager); role=alert on /login /signup /for-masjids
  errors; OfflineIndicator is a role=status live region (and no longer hydration-
  mismatches). Contrast: --ink-4 was 2.5:1 on bg (AA fail) -> retuned light
  #7a6b55 / dark #9a8c76, both >=4.5. `npm run check:a11y` (axe-core in jsdom over
  6 screens) is green and wired into CI; jsx-a11y eslint rules promoted to errors.
  The NVDA/VoiceOver pass, full keyboard walk, and non-token contrast checks are
  documented as remaining manual pre-launch work in docs/review/2026-09-06-a11y.md.
commits: fbe2d7b
depends_on: [T25]
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
Legal (accessibility law) and right. The T25 redesign should bake it in; this is the audit +
fixes across the whole app.

## Done when
- [x] Skip link + landmarks + visible focus + drawer focus-trap/Escape/scroll-lock; full keyboard walk = manual (doc)
- [~] Form labels + error announcement (role=alert) + a live region done; the NVDA/VoiceOver pass itself is manual pre-launch (doc)
- [x] --ink-4 retuned to >=AA both themes; prefers-reduced-motion handled; axe check in CI (npm run check:a11y)

## Notes (owner appends)
