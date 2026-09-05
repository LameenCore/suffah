---
id: T25
title: Full UI/UX redesign - warm community design system
phase: 8
status: done
owner: https://claude.ai/code/session_01KZau462fdpkrsdLZNLrD9T
claimed: 2026-09-05T18:00:00Z
updated: 2026-09-05
completed: 2026-09-05T18:30:00Z
outcome: |
  Warm community design system shipped across all three dashboards + landing +
  print. Built over two sessions (01SKEyp did the bulk: tokens/fonts, ui/*
  primitives, Sidebar+DashboardChrome, landing, student path, parent, admin
  metrics home + nav + sub-page re-skin, in-app help/inbox). This session took
  over the stale claim and finished: sidebar profile no longer prints the role
  twice for the generic demo admin (falls back to email); reverted 12 &mdash;
  entities the redesign reintroduced into user copy back to hyphens (repo
  AI-tell convention); moved the compliance print route out of /admin
  (app/print/compliance/[studentId]) so it no longer inherits the dashboard
  sidebar - was rendering the full nav rail in the "printable" tab; print:hidden
  on the sidebar rail + mobile bar. build + lint + tsc + 33 tests green; all 16
  demo routes 200 with real data. Visual note: 01SKEyp screenshot-verified
  landing, student lesson/playground, parent, admin overview/volunteers/seerah/
  barakah/ledger; pods/continuity/handoff-demo/compliance/print + mobile drawer
  are HTTP-verified + code-reviewed here (no browser extension available this
  session) - recommend a quick screenshot pass in T28 recording prep.
commits: <t25-final>
depends_on: []
---

## Goal
The app works but looks bad. Do a proper UI/UX pass, not a repaint: rethink
information architecture and placement, then apply a warm, communal design system.

Design brief (from the user):
- Palette: warm terracotta, deep teal, golden mustard, soft coral; warm neutrals
  (cream/sand) not cold grey. Subtle Islamic geometric accents (eight-pointed
  stars, interlocking tile motifs) in card borders / background texture, not
  overpowering.
- Mood: cozy family living room meets modern edtech. Rounded cards, generous
  whitespace, hand-drawn-feeling illustrated accents (books, small mosque
  silhouette, lantern, crescent), calligraphy-inspired dividers (decorative, not
  real Arabic text).
- Student Playground: a friendly progress path/garden of lesson nodes for the 3
  courses, a small age-appropriate companion/mascot, crescent/lantern progress
  motif, streak indicator, warm greeting header.
- Parent view: calm, minimal, muted same-family palette. Weekly summary, pod
  schedule card w/ masjid icon, fee status.
- Admin: clean, organised - it has many sub-pages, needs real nav.

## Done when
- [x] Design tokens + fonts (globals.css, layout) - warm palette, light + dark
- [x] Shared primitives: Card, Button, Badge, PageHeader, StatCard, geometric
      pattern, mascot, dividers
- [x] Chrome redesigned (header/sidebar), landing page
- [x] Student: home (path/garden), course/lesson, checkpoint, term exam
- [x] Parent: dashboard + evaluation status (fix the orphaned /parent/compliance)
- [x] Admin: nav + every sub-page on the system
- [x] Whole demo walkthrough looks good, IA makes sense, build + lint green

## Notes (owner appends)
- Fonts must come from Google Fonts (next/font/google) - no other CDNs.
- Keep all existing routes + server actions working; this is presentation + IA only.
- Coordinate: this touches many files. Other sessions should avoid app/ and
  components/ while this is doing.
