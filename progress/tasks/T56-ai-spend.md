---
id: T56
title: AI spend monitoring + budget alerts + metering
phase: 12
status: done
owner: https://claude.ai/code/session_01KZau462fdpkrsdLZNLrD9T
claimed: 2026-09-06T05:00:00Z
completed: 2026-09-06T05:45:00Z
updated: 2026-09-05
depends_on: [T34]
source: post-hackathon roadmap (EdTech-checklist analysis)
outcome: |
  Built on T34's model_call_log. migration 0012_ai_budget: masjid_ai_budget
  (monthly_limit_usd, soft_alert_ratio, hard_cap_enabled). lib/ai/budget.ts:
  getMonthSpend (sum model_call_log cost_usd for the calendar month, by feature),
  getBudgetStatus (spend/limit -> ok|warn|over via pure budgetState()),
  get/setAiBudget, and assertWithinAiBudget(feature, masjidId) which throws
  AiBudgetExceededError when over the hard cap. Wired assertWithinAiBudget into
  all 5 generators before the model call - over budget, lesson/checkpoint/
  assessment/briefing fall back to hand-authored content (term_exam has no
  fallback, so it surfaces the error to the admin). /admin/ai-spend page:
  month-to-date spend + budget bar + state badge, by-feature breakdown, a budget
  form (BudgetForm client component + setBudgetAction, audited as
  ai_budget.updated), and a waqf-ledger reconciliation panel (operating draw vs
  metered AI spend). Added to admin sidebar nav + the overview grid (audit trail
  too, which T35 missed). Seed: masjid_ai_budget row + the 24 model_call_log
  rows re-dated into the current month. tests: budgetState boundaries + the T34
  cost math (53 total). Verified live: page shows $0.51 / 24 calls / by-feature;
  dropping the limit to $0.01 -> state=over -> assertWithinAiBudget throws
  AiBudgetExceededError. build + lint + tsc + 53 tests + check:integrity green.
commits: fc67d20
---

## Why
The whole thesis is 'AI carries instruction'. Its cost is the operating-model risk. It must
be measured per masjid and alertable.

## Done when
- [x] Per-call cost logged (T34: model_call_log) + a rollup view (/admin/ai-spend)
- [x] Monthly budget per masjid + soft alert (warn state) + hard cap that falls back
      to cached content (assertWithinAiBudget in every generator)
- [x] Waqf-ledger reconciliation panel on /admin/ai-spend (operating draw vs AI spend)

## Notes (owner appends)
- 2026-09-05: soft alert = a `warn` state + amber bar on the page; there is no
  outbound notification (email is T58). Wire an alert into T58's channel when it
  lands, keyed on `getBudgetStatus().state === "warn"`.
- The hard cap reads month-to-date spend on every generate call (one extra query
  behind a Promise.all). Fine at demo/pilot volume; cache getBudgetStatus per
  request or per minute if generate traffic grows.
- Reset caveat inherited from T30/T34: `npm run seed` cascades masjid_ai_budget +
  model_call_log; re-run seed to restore the budget row + the illustrative spend.
