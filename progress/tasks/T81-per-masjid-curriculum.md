---
id: T81
title: Per-masjid curriculum — adopt shared or fork/author own
phase: 13
status: todo
owner: —
claimed: —
updated: 2026-09-06
depends_on: [T50, T63]
source: split from T63 (its 2nd "done when" bullet)
---

## Why
T63 lets a masjid be provisioned with a starter curriculum skeleton (3 courses,
1 unit, 3 nodes each — no lesson content). T50 builds the admin course-authoring
UI. This task connects them: a new masjid should be able to **adopt** the shared
Secondary 1 curriculum wholesale, or **fork** it and edit — especially Seerah,
which is community-specific and has no external curriculum body.

## Done when
- [ ] "Adopt shared curriculum" action for a masjid: copies the reference courses
      / units / pathway_nodes (and optionally the generated lesson_content) into
      the masjid's tenant
- [ ] "Fork" = adopt + immediately editable via the T50 authoring UI; changes stay
      in that masjid, don't touch the reference
- [ ] A reference/shared curriculum exists as a distinct thing (a `reference`
      masjid, or a `masjid_id IS NULL` shared set) that new masjids copy from
- [ ] Seed / provisioning updated so `seedCurriculumSkeleton` can optionally pull
      the full reference content instead of an empty skeleton

## Notes (owner appends)
- Decide the storage model for "shared": a sentinel reference masjid is simplest
  and keeps every FK/RLS assumption intact.
- `lib/platform/seed-masjid.ts` (`seedCurriculumSkeleton`) is the current
  provisioning hook.
