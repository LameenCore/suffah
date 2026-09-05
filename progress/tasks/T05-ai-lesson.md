---
id: T05
title: lib/ai/lesson.ts — generate + persist lesson nodes
phase: 2
status: doing
owner: https://claude.ai/code/session_01SKEypdSNQf7yjj5E411g4B
claimed: 2026-09-05T00:00:00Z
updated: 2026-09-05
depends_on: [T03]
---

## Goal
Generate and PERSIST one lesson node each for Math, Seerah, AI Literacy (Secondary 1 band).
Content is stored, never regenerated on view — pod continuity depends on stable content.
Read the claude-api skill before writing Anthropic calls.

## Done when
- [ ] lib/ai/lesson.ts generates a lesson for a given pathway_node
- [ ] Generated lesson persisted to the DB
- [ ] One lesson exists for each of the 3 courses

## Notes (owner appends)
