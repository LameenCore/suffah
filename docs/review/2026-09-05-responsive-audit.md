# Responsive / mobile audit — 2026-09-05 (T62)

Audited every route at **360 / 768 / 1280** against three rules: no horizontal
page scroll, nav-critical tap targets ≥ 44 px, and the data-dense admin pages
(tables, the ledger chart, the continuity matrix) usable one-handed.

Method: static review of every `app/**/page.tsx`, every `app/**/layout.tsx`, and
every component in `components/**` against the breakpoints, plus targeted fixes.
A live device pass (real Safari/Chrome at 360 px) is still worth doing before a
public launch — noted at the end.

## Verdict

**The T25 redesign already bakes in responsiveness.** Every multi-column grid
carries a breakpoint prefix (`sm:` / `lg:` / …) and collapses to one column on a
phone; every `<table>` sits in an `overflow-x-auto` wrapper; every inline SVG
(`LedgerChart`, `WaqfFlowDiagram`, the compliance snapshot) uses
`viewBox` + `w-full` + `height:auto`; `img { max-width: 100% }` is in
`globals.css`; the sidebar is a proper drawer under `md`. No route was found that
scrolls the page sideways at 360 px.

The gaps were small and are fixed in this pass.

## Fixes applied

| # | Where | Problem | Fix |
|---|---|---|---|
| 1 | `app/globals.css` `body` | No page-level guard — one stray wide child would scroll the whole page sideways | `overflow-x: clip` on `body` (`clip`, not `hidden`, so `position: sticky` on the sidebar keeps working) |
| 2 | `components/Sidebar.tsx` — mobile "Menu" button | `px-2.5 py-1.5` ≈ 32 px tall, under 44 | `min-h-11` + `px-3.5`, flex-centered |
| 3 | `components/Sidebar.tsx` — drawer "Close" button | `px-2 py-1` ≈ 26 px | `min-h-11` + `px-3`, added `aria-label` |
| 4 | `components/Sidebar.tsx` — nav links (rail + drawer share this markup) | `px-3 py-2` ≈ 36 px | `min-h-11` |
| 5 | `components/Sidebar.tsx` — footer "sign out" | `px-2.5 py-1` ≈ 26 px | `min-h-9` + `px-3`, flex-centered (secondary control, 36 px is the floor here) |
| 6 | `app/login/page.tsx` — "try the demo" role buttons | `px-3 py-1.5 text-xs` ≈ 28 px; these are the first thing a judge taps | `min-h-11 w-full`, flex-centered |
| 7 | `app/admin/ledger/page.tsx` — "all ledger entries" table | `overflow-x-auto` present but no `min-w`, so 4 columns crush at 360 px instead of scrolling | `min-w-[32rem]` on the table |
| 8 | `app/admin/pods/page.tsx` — pathway-per-pod table | same | `min-w-[30rem]` |

`app/admin/analytics/page.tsx` (built in T64) already uses `min-w-[36rem]` on its
cohort table — the pattern the two above now match.

## Checked and left as-is

- **`components/compliance/ComplianceReportView.tsx`** table — 4 short `text-xs`
  columns, fits ~380 px naturally, and the component is shared with the print
  routes where a forced `min-w` would be wrong. The `overflow-x-auto` wrapper
  already contains it.
- **`LedgerChart` / `WaqfFlowDiagram`** — SVG `viewBox` scales; the hover layer is
  mouse-only but that is a progressive enhancement, not a breakage. Axis text is
  small at 360 px but legible.
- **`CoursePath`** node stepper — `flex flex-1` connectors compress to the
  container; no overflow.
- **`SubNav`** — `flex gap-1 overflow-x-auto` with `whitespace-nowrap` tabs at
  `py-2.5` (40 px); scrolls horizontally on a narrow screen as intended.
- **`Button` component `size="sm"`** (`py-1.5 text-xs` ≈ 28 px) — used densely in
  admin tables/cards. Left unchanged: forcing 44 px on every inline secondary
  control would wreck the admin density, and WCAG 2.5.8 (AA) allows 24 px with
  spacing. Primary CTAs use `size="md"` (`py-2.5` ≈ 42 px).
- Footer legal links (`text-xs` inline `<a>` in a flex row) — inline-text targets,
  exempt from the 44 px rule.

## Still worth doing before a public launch

- A **real-device pass** (iOS Safari + Android Chrome at 360 px) — static review
  catches layout math, not font-boosting, momentum-scroll quirks, or the URL-bar
  resize jump.
- A **focus-trap + `Escape` + body-scroll-lock** on the mobile drawer — currently
  it closes on backdrop tap and link click only. That is an **accessibility**
  item and belongs to **T60**, not this pass.
- `prefers-reduced-motion` handling for the `.wf-stream` ledger animation and the
  `transition-*` hovers — also **T60**.
