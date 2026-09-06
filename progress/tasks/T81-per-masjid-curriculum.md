---
id: T81
title: Per-masjid curriculum — adopt shared or fork/author own
phase: 13
status: done
owner: —
claimed: —
updated: 2026-09-06
completed: 2026-09-06T00:00:00Z
outcome: >
  Shared curriculum lives in a sentinel 'reference' masjid (migration 0024 adds
  masjids.kind + seeds the row; `npm run seed:reference` deep-copies the demo
  masjid's 3 courses / 9 nodes WITH generated lesson+checkpoint content into it).
  lib/platform/reference-curriculum.ts: copyCurriculum(from,to) /
  adoptSharedCurriculum(to) / referenceHasCurriculum() — a name-dedup deep copy,
  idempotent, safe to re-run. provisionMasjid() now adopts the full shared
  curriculum (skeleton is the fallback). /admin/authoring empty state gets an
  "Adopt the shared Secondary 1 curriculum" button (audited course.curriculum_
  adopted); the copy is the masjid's own and editable via T50's UI = the fork.
  Platform overview + provisioning exclude kind='reference'. Verified live:
  adopt copies 3/9 with content, second adopt is a no-op, reference hidden from
  the platform list.
commits: 4b94c11
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
- [x] "Adopt shared curriculum" action for a masjid: copies the reference courses
      / units / pathway_nodes (and optionally the generated lesson_content) into
      the masjid's tenant
- [x] "Fork" = adopt + immediately editable via the T50 authoring UI; changes stay
      in that masjid, don't touch the reference
- [x] A reference/shared curriculum exists as a distinct thing (a `reference`
      masjid, or a `masjid_id IS NULL` shared set) that new masjids copy from
- [x] Seed / provisioning updated so `seedCurriculumSkeleton` can optionally pull
      the full reference content instead of an empty skeleton

## Notes (owner appends)
- Decide the storage model for "shared": a sentinel reference masjid is simplest
  and keeps every FK/RLS assumption intact.
- `lib/platform/seed-masjid.ts` (`seedCurriculumSkeleton`) is the current
  provisioning hook.
