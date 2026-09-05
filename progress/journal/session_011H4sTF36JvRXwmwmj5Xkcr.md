# Journal — session_011H4sTF36JvRXwmwmj5Xkcr

Session URL: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
Started: 2026-09-05

Append-only. Only this session writes here.

---

## 2026-09-05 — claimed T11 (Admin dashboard — pods, assignment, continuity view)
Read CLAUDE.md, AGENTS.md, ARCHITECTURE.md, DATA_MODEL.md, api-design.md, git-workflow.md,
progress/README.md, Next 16 mutating-data doc. Reviewed existing app/admin, lib/auth,
lib/db, lib/db/queries.ts, supabase/migrations/0001_init.sql + seed.sql, shared components.

T07 was the critical-path pick but its deps include T06 (still `doing` by another session),
so it's not eligible. T11's only dep is T04 (done). Picked T11 — no file overlap with the
T06 owner (they're in /student), and it unblocks T12/T14/T15.

Note: `.env.local` is not present in this checkout, so no live Supabase/Anthropic. Building
T11 to the same standard as T05 (typechecks + builds; runs when Supabase is configured).
Verification here = `next build` + `eslint` + `tsc --noEmit`.

Plan:
- lib/db/queries.ts — add masjid-scoped reads: pods w/ volunteer + students + counts,
  courses, student users, volunteers, pod_progress continuity (pod x course -> current node).
- lib/pods/assign.ts — assignment ops: add/remove student (hard cap 4, one pod per student,
  tenancy checks), assign/clear volunteer. DB trigger already enforces the cap; mirror it in
  app code so the UI can show a clean error instead of a 500.
- app/admin/pods/page.tsx — server component: pod cards (volunteer select, student list w/
  remove, add-student select) + continuity matrix (pods x 3 courses).
- app/admin/pods/actions.ts — "use server", requireRole('admin') + masjid scoping,
  revalidatePath('/admin/pods').
- app/admin/page.tsx — point the "Pods" card at /admin/pods.
- RegulationNote on the pods page for the 4-student cap.
