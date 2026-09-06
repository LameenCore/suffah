---
id: T50
title: Admin course-authoring UI
phase: 11
status: doing
owner: background agent (T50)
claimed: 2026-09-05T00:00:00Z
updated: 2026-09-05
depends_on: []
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
Courses/units/nodes only exist via seed scripts. A masjid adding a course (or fixing a node)
should not need a developer.

## Done when
- [ ] Admin CRUD for courses -> units -> pathway_nodes (title, order, unit grouping,
      prerequisites)
- [ ] Trigger AI generation for a node's lesson/checkpoint from the UI; edit + re-version
      the result (reuse T22 revision plumbing)
- [ ] Guardrail: cannot delete a node with student results; changes are audit-logged

## Notes (owner appends)
