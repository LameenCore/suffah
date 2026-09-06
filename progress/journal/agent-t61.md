# Journal — agent-t61 (background agent)

Session URL: https://claude.ai/code/session_01KZau462fdpkrsdLZNLrD9T
Started: 2026-09-06T00:31:00Z

One append-only log. Only this agent writes here. Newest entries at the bottom.

---

## 2026-09-06T00:31:00Z — claimed T61
Picked T61 (no deps). Set `status: doing`, `owner: background agent (T61)`,
`claimed: 2026-09-06T00:31:00Z` in the task file. Committing the claim.

Context read: CLAUDE.md, AGENTS.md, Next 16 docs (progressive-web-apps.md,
offline-support.md, metadata/manifest.md), progress/README.md, security-review
skill, student route + actions + queries + checkpoint/questions libs, i18n
system, globals.css palette.

Note: working tree has uncommitted edits from the concurrent T59 session
(app/student/[courseId]/page.tsx, components/student/*, lib/ai/*, lib/i18n/*).
I will stage only my own paths on every commit — never `git add -A` — to avoid
sweeping their WIP into my commits.

Plan:
- `app/manifest.ts` (Next 16 metadata route) — name/icons/theme `#c05e3b`,
  bg `#faf4ea`, `display: standalone`, `start_url: /student`.
- `public/icons/*` PNG (192/512/maskable/apple) generated from the Star8 motif
  via a one-off Node script (zlib, no deps) + `icon.svg`.
- `public/sw.js` — hand-rolled ~80-line SW: precache app shell + `/offline`,
  runtime cache `/_next/static` + navigations (network-first, cache fallback).
  Registered prod-only from a client component in the root layout.
- `lib/offline/` — tiny IndexedDB wrapper: stores the downloaded unit bundle
  (nodes + lesson_content + checkpoint_content incl. answers — student's own
  course, acceptable for demo; tradeoff noted) + a queue of offline
  lesson-complete marks and checkpoint attempts.
- `app/api/offline/unit/route.ts` — GET: the signed-in student's own current
  unit bundle. Student role only, masjid-scoped, own pod only.
- `app/offline/page.tsx` — root-level (not under the authed student layout so it
  works with the network down) client "offline classroom": page through the
  downloaded lessons, take checkpoints, answers queue.
- `components/OfflineIndicator.tsx` — online/offline + pending-sync badge, in the
  student chrome. Replays the queue against existing server actions on reconnect.
- `components/student/DownloadUnitButton.tsx` — on the student home.
- i18n keys added to BOTH en.ts and fr.ts.
