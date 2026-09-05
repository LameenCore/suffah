---
id: T25
title: Full UI/UX redesign - warm community design system
phase: 8
status: doing
owner: https://claude.ai/code/session_01KZau462fdpkrsdLZNLrD9T
claimed: 2026-09-05T18:00:00Z
updated: 2026-09-05
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
- [ ] Design tokens + fonts (globals.css, layout) - warm palette, light + dark
- [ ] Shared primitives: Card, Button, Badge, PageHeader, StatCard, geometric
      pattern, mascot, dividers
- [ ] Chrome redesigned (header/sidebar), landing page
- [ ] Student: home (path/garden), course/lesson, checkpoint, term exam
- [ ] Parent: dashboard + evaluation status (fix the orphaned /parent/compliance)
- [ ] Admin: nav + every sub-page on the system
- [ ] Whole demo walkthrough looks good, IA makes sense, build + lint green

## Notes (owner appends)
- Fonts must come from Google Fonts (next/font/google) - no other CDNs.
- Keep all existing routes + server actions working; this is presentation + IA only.
- Coordinate: this touches many files. Other sessions should avoid app/ and
  components/ while this is doing.
