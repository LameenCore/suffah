/**
 * One command to get the machine into a clean demo state.
 *
 *   npm run demo:setup   # full: migrate + seed + generate all AI content + demo state
 *   npm run demo:reset    # state only: reseed + reset progress (keeps generated content)
 *
 * `demo:reset` is what you run between practice runs of the walkthrough - it's
 * fast because it doesn't re-hit the Anthropic API.
 */

import { execSync } from "node:child_process";

const RESET_ONLY = process.argv.includes("--reset-only");

const FULL: [string, string[]][] = [
  ["scripts/migrate.ts", []],
  ["scripts/seed.ts", []],
  ["scripts/generate-lessons.ts", []],
  ["scripts/generate-checkpoints.ts", []],
  ["scripts/generate-assessments.ts", []],
  ["scripts/generate-term-exams.ts", []],
  ["scripts/seed-continuity.ts", ["--reset"]],
  ["scripts/seed-demo-progress.ts", ["--reset"]],
];

// State only - no `seed.ts` (it wipes the generated curriculum) and no `gen:*`.
const RESET: [string, string[]][] = [
  ["scripts/seed-demo-progress.ts", ["--reset"]], // pod position, student results, volunteer
  ["scripts/seed-continuity.ts", ["--reset"]], // session notes + a fresh briefing
];

const steps = RESET_ONLY ? RESET : FULL;
const failed: string[] = [];

for (const [script, args] of steps) {
  console.log(`\n\x1b[1m> ${script} ${args.join(" ")}\x1b[0m`);
  try {
    // args are all hardcoded literals above, so a shell string is safe here.
    execSync(`npx tsx --env-file=.env.local ${script} ${args.join(" ")}`.trim(), {
      stdio: "inherit",
    });
  } catch {
    // A single generator hiccup (e.g. a flaky structured-output parse) must not
    // stop the rest - the seed steps especially need to run.
    console.error(`\x1b[33m! ${script} exited non-zero - continuing.\x1b[0m`);
    failed.push(`${script} ${args.join(" ")}`.trim());
  }
}

if (failed.length > 0) {
  console.log(
    `\n\x1b[33m! Finished with ${failed.length} failed step(s):\x1b[0m\n  ` +
      failed.join("\n  ") +
      `\n  Re-run just those, e.g. \`npm run gen:exams\`.`,
  );
}

console.log(
  `\n\x1b[32m✓ Demo ${RESET_ONLY ? "reset" : "set up"}.\x1b[0m Sign in as student / parent / admin.` +
    `\n  student: Yusuf is fresh on Math - do lesson + checkpoint live (demo step 1).`,
);
