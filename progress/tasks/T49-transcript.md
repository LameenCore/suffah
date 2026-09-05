---
id: T49
title: Term-completion record / transcript export
phase: 11
status: done
owner: https://claude.ai/code/session_01KZau462fdpkrsdLZNLrD9T
claimed: 2026-09-06T06:00:00Z
completed: 2026-09-06T06:40:00Z
updated: 2026-09-05
outcome: |
  lib/transcript.ts: assembleTranscript (per-course units/checkpoints/assessments/
  term exam from getChildReport - no new queries) + transcriptToCsv. lib/db/
  access.ts: canViewStudent / assertCanViewStudent (admin in masjid OR linked
  parent). Printable page /print/transcript/[studentId] (outside chrome, like the
  T25 compliance print) with a masjid signature+stamp block and a
  regulation-verification note on equivalency. Machine-readable
  GET /api/transcript/[studentId]?format=json|csv (same access check).
  Links: SnapshotBar (admin compliance) gets "Term-completion record" +
  "Export CSV"; /parent gets the same two per child. tests/transcript.test.ts
  (CSV shape, %/date formatting, blank cells, comma quoting) - 57 total.
  Verified live: admin 200, linked parent 200, non-linked parent 404, student
  viewing another student 403; CSV downloads with the right columns.
commits: 1246ff8
depends_on: [T12]
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
Beyond the compliance snapshot, a family needs a clean per-student record of units
completed, checkpoints passed, and term-exam results - portable if they leave.

## Done when
- [x] A per-student transcript as a styled printable (/print/transcript/[id]) + a
      machine-readable export (/api/transcript/[id]?format=json|csv)
- [x] Signature + stamp block on the printable; regulation-verification note on the
      equivalency point
- [x] Available to the parent (linked children only) and the admin

## Notes (owner appends)
- 2026-09-05: "term + all-time" collapsed to one record for the demo scope (one
  term exists). assembleTranscript takes a termLabel so a multi-term version is a
  small extension.
- lib/db/access.ts (canViewStudent) is the first shared relationship-level check;
  reuse it for T47/T48 (parent/volunteer views of a student) rather than
  re-deriving the parent_children join.
