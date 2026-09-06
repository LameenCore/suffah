---
id: T50
title: Admin course-authoring UI
phase: 11
status: done
owner: https://claude.ai/code/session_01KZau462fdpkrsdLZNLrD9T (background agent + main session integration)
claimed: 2026-09-05T00:00:00Z
updated: 2026-09-05
depends_on: []
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
Courses/units/nodes only exist via seed scripts. A masjid adding a course (or fixing a node)
should not need a developer.

## Done when
- [x] Admin CRUD for units + pathway_nodes (create / rename / reorder / set-unit /
      add-unit / delete) at /admin/authoring. Prereqs are edited on /admin/skill-tree (T43).
- [x] Per-node: hand-edit the persisted lesson/checkpoint JSON (validated against
      LessonBodySchema/CheckpointBodySchema, stamps a fresh generatedAt version, node id
      unchanged so mid-way pods are safe) OR "Regenerate" -> generateLessonForNode /
      generateCheckpointForNode with force:true (admin-only, budget-gated, logged)
- [x] Delete refused when a node is any pod's current_node_id OR has checkpoint_results /
      lesson_progress rows; remaining nodes re-sequenced contiguously. Every mutation
      recordAudit'd (course.node_added / renamed / reordered / deleted / unit_set /
      unit_added / lesson_saved / lesson_regenerated / checkpoint_saved / checkpoint_regenerated).

## Outcome (background agent + session 01KZau4, 2026-09-05)

lib/db/authoring-queries.ts (masjid-scoped): listAuthoringCourses / getAuthoringCourse
(units + nodes) / getNodeContent, and writes createNode / renameNode / moveNode /
setNodeUnit / addUnit / deleteNode / saveLessonJson / saveCheckpointJson.
app/admin/authoring/{page,[courseId]/page,actions}.ts + components/admin/
CourseAuthoringEditor.tsx (client). Nav entry + i18n key (nav.authoring en/fr).
lib/ai/{lesson,checkpoint}.ts: exported the zod body schemas for JSON validation.
audit page: 10 course.* ACTION_LABEL entries. No migration (reuses pathway_nodes/units).

Verified: /admin/authoring + course editor render (200); create -> rename -> delete a
throwaway node works and re-sequences to 1,2,3; delete of a pod's current node is
refused ("1 pod(s) are currently on this node"); the student playground for that
course still renders. build + lint + tsc + 62 tests + check:integrity green.

NOTE: this was implemented by a background agent that was running in the SAME
working directory as other sessions (a mistake - agents should use isolated
worktrees). The agent committed only its claim; the main session integrated,
verified, and committed the implementation.

## Notes (owner appends)
