---
id: T43
title: Prerequisite / skill-tree mapping
phase: 11
status: done
owner: https://claude.ai/code/session_01KZau462fdpkrsdLZNLrD9T
claimed: 2026-09-06T11:30:00Z
updated: 2026-09-05
completed: 2026-09-06T12:15:00Z
commits: c07cc95
depends_on: []
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
Nodes are a flat sequence. A prerequisite graph enables adaptivity, 'why am I stuck'
explanations, and cross-course dependencies (Seerah timeline <-> AI-literacy reasoning is
weak, but Math is a real chain).

## Done when
- [ ] pathway_nodes gain prerequisite edges (within and across courses); a skill/concept tag
      per node
- [ ] The playground shows a node as locked until its prereqs are passed, with the reason
- [ ] Admin can view/edit the graph

## Outcome (session 01KZau4, 2026-09-05)

migration 0017_skill_tree: `pathway_nodes.concept_tag` + `node_prerequisites`
(node_id, prereq_node_id; edges cross courses; `node_id <> prereq_node_id` check).

lib/db/skill-tree-queries.ts:
- `listSkillGraph(masjidId)` - nodes + edges, masjid-scoped
- `getPrereqStatus(studentUserId, masjidId)` - per-node `{locked, unmet[]}`: a node
  is locked when a prereq's checkpoint isn't on the student's record
- `addPrerequisite` - tenancy on both nodes, rejects self-edge AND a **cycle** (DFS
  over the existing graph), `removePrerequisite`, `setConceptTag`

Playground: `/student/[courseId]` computes `getPrereqStatus` for the student; a
locked current node renders "Locked for now - finish X (Course) first" instead of
the lesson/checkpoint. (Pods still advance through their own course in order -
this is the cross-course / adaptivity gate, per the task.)

Admin: `/admin/skill-tree` + `SkillTreeEditor` (client) - nodes grouped by course,
inline concept-tag editor, removable prereq chips, add-prerequisite select.
Actions audited (`skill_tree.prereq_added/removed`). Nav entry + i18n key.

Seed: concept tags on the 4 relevant nodes; edges Math3<-Math2<-Math1 (the real
chain) + AI-Lit3<-Math1 (the "weak but real" cross-course link the task names).
check-integrity check 14: `node_prerequisites` is acyclic.

Verified via script: edges seeded, cycle guard rejects math1<-math3, Yusuf (fresh)
sees math2 + ai3 as locked on "Adding and subtracting integers". Admin page + all
routes render. build + lint + tsc + 62 tests + check:integrity(14) green.

Follow-ups: T46 (recommendations) can read the graph; T42's real per-student
skip-ahead wants a student_progress override that respects this graph.

## Notes (owner appends)
