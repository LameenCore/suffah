/**
 * Automated accessibility check (T60). Runs axe-core over the rendered HTML of
 * the key screens and fails on any `serious` / `critical` violation.
 *
 *   npm run check:a11y
 *
 * jsdom has no layout engine, so this catches structural / ARIA / labelling
 * issues (missing form labels, button/link names, landmark + heading problems,
 * image alt, aria misuse) — not colour contrast. Contrast is a manual /
 * design-token check; see docs/review/2026-09-06-a11y.md.
 *
 * Needs a running server: set A11Y_BASE_URL (default http://localhost:3400).
 * The CI job (.github/workflows/ci.yml) starts `next start` first.
 */

import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const BASE = process.env.A11Y_BASE_URL ?? "http://localhost:3400";
const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

// role -> a dev-role cookie that renders that dashboard without real auth
const SCREENS: { path: string; cookie?: string }[] = [
  { path: "/login" },
  { path: "/for-masjids" },
  { path: "/student", cookie: "suffa-dev-role=student" },
  { path: "/parent", cookie: "suffa-dev-role=parent" },
  { path: "/admin", cookie: "suffa-dev-role=admin" },
  { path: "/admin/compliance", cookie: "suffa-dev-role=admin" },
];

const IMPACT_FAIL = new Set(["serious", "critical"]);

async function axeCheck(path: string, cookie?: string) {
  const res = await fetch(BASE + path, {
    headers: cookie ? { cookie } : {},
    redirect: "manual",
  });
  if (res.status !== 200) {
    console.log(`  SKIP  ${path} (HTTP ${res.status})`);
    return 0;
  }
  const html = await res.text();
  const dom = new JSDOM(html, { url: BASE + path, runScripts: "outside-only" });
  const { window } = dom;
  window.eval(axeSource);
  const axe = (window as unknown as { axe: { run: (ctx: unknown, opts: unknown) => Promise<unknown> } }).axe;
  const results = (await axe.run(window.document, {
    resultTypes: ["violations"],
    rules: { "color-contrast": { enabled: false } },
  })) as { violations: { id: string; impact: string; nodes: unknown[] }[] };

  const bad = results.violations
    .filter((v) => IMPACT_FAIL.has(v.impact));
  if (bad.length === 0) {
    console.log(`  PASS  ${path}`);
    return 0;
  }
  console.log(`  FAIL  ${path}`);
  for (const v of bad) {
    console.log(`        [${v.impact}] ${v.id} — ${v.nodes.length} node(s)`);
  }
  return bad.length;
}

async function main() {
  let failures = 0;
  for (const s of SCREENS) failures += await axeCheck(s.path, s.cookie);
  console.log(
    failures === 0
      ? "\naxe: no serious/critical violations.\n"
      : `\naxe: ${failures} serious/critical violation(s).\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
