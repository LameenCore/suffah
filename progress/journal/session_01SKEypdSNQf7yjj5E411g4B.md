# Journal — session_01SKEypdSNQf7yjj5E411g4B

Session URL: https://claude.ai/code/session_01SKEypdSNQf7yjj5E411g4B
Started: 2026-09-05

Append-only. Only this session writes here.

---

## 2026-09-05 — claimed T05 (lib/ai/lesson.ts — generate + persist lesson nodes)
Read PRD/ARCHITECTURE/DATA_MODEL/api-design/git-workflow, the claude-api skill, Next 16
route-handler + mutating-data docs. Claimed T05, commit b0d4b63.

Plan:
- add `@anthropic-ai/sdk`
- `lib/ai/client.ts` — shared Anthropic client (LESSON_MODEL already = claude-sonnet-5 in index.ts)
- `lib/ai/lesson.ts` — generateLessonForNode(nodeId): builds a course-aware prompt,
  calls Claude with structured output, persists to pathway_nodes.lesson_content, returns row.
  Never regenerates if lesson_content already present (continuity guarantee).
- `lib/db/queries.ts` — masjid-scoped read helpers (node + course lookup)
- offline fallback lesson content per api-design.md ("graceful fallback if Anthropic call fails")
- `app/api/lessons/generate/route.ts` — POST { nodeId } (admin/student role), returns persisted row
- `scripts/generate-lessons.ts` — one-shot: generate the first node of each of the 3 courses

Note: .env.local has empty NEXT_PUBLIC_SUPABASE_URL and empty ANTHROPIC_API_KEY.

## 2026-09-05 — BUG: .env.local Supabase URL typo
User set the keys. NEXT_PUBLIC_SUPABASE_URL was `https://hpxfsmkwxlkfiohlelgus.supabase.co`
(trailing `s`) — does not resolve (ENOTFOUND). JWT project ref in both anon + service keys
is `hpxfsmkwxlkfiohlelgu`. Fixed the URL in .env.local (gitignored, not committed). Flagged
to user in case the trailing-s ref is actually correct and the keys are the stale ones.

## 2026-09-05 — BUG: demo DB schema applied but seed data missing
gen:lessons found 0 pathway nodes. All tables exist (migration applied) but every table
empty — supabase/seed.sql was never run against the project, and there's no Supabase CLI
or SQL-editor access wired up here. Root fix: `scripts/seed.ts` + `npm run seed` — ports
seed.sql through the service-role client (idempotent: deletes demo masjid, FK-cascade wipe,
re-inserts). Keep in sync with supabase/seed.sql. Commit <seed>.

## 2026-09-05 — T05 done
- `@anthropic-ai/sdk` + `zod` added; `tsx` devDep for scripts.
- `lib/ai/client.ts` — shared Anthropic client, lazy, throws AiNotConfiguredError.
- `lib/ai/lesson.ts` — `generateLessonForNode(nodeId, masjidId, {force})`. Course-aware
  prompt (Math→Québec Sec 1 + regulation note; Seerah→community tradition; AI Lit→meta).
  Structured output via `messages.parse` + `zodOutputFormat`. Persists to
  pathway_nodes.lesson_content. Never regenerates if lesson_content present (continuity).
- `lib/ai/fallback-lessons.ts` — hand-authored lesson for node 1 of each course; used when
  the model call fails/unconfigured (api-design.md graceful-fallback rule).
- `lib/db/queries.ts` — masjid-scoped getPathwayNode / getFirstNodePerCourse / saveLessonContent.
- `app/api/lessons/generate/route.ts` — POST {nodeId,force}; admin|student; masjid-scoped.
- `scripts/generate-lessons.ts` + `npm run gen:lessons` — generate node 1 of all 3 courses.
- Ran it: all 3 lessons generated source=model, persisted, verified in DB. Re-run = no-op.
- build + lint + tsc all green. Commit <t05>.
