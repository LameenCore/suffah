/**
 * One-shot: generate + persist the first lesson node of every course in the demo
 * masjid. Satisfies T05's "one lesson exists for each of the 3 courses".
 *
 *   npm run gen:lessons          # generate any node that has no lesson yet
 *   npm run gen:lessons -- --force   # regenerate all three
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and ANTHROPIC_API_KEY
 * in .env.local (loaded via tsx --env-file). Without ANTHROPIC_API_KEY the
 * hand-authored fallback lesson is persisted instead.
 */

import { DEMO_MASJID_ID } from "@/lib/auth";
import { getFirstNodePerCourse } from "@/lib/db/queries";
import { generateLessonForNode } from "@/lib/ai/lesson";

async function main() {
  const force = process.argv.includes("--force");

  const nodes = await getFirstNodePerCourse(DEMO_MASJID_ID);
  if (nodes.length === 0) {
    throw new Error(
      "No pathway nodes found. Run supabase/migrations/0001_init.sql and supabase/seed.sql first.",
    );
  }

  console.log(`Generating lessons for ${nodes.length} node(s)${force ? " (force)" : ""}…\n`);

  let failures = 0;
  for (const node of nodes) {
    const label = `${node.course.name} · node ${node.sequence_order} · "${node.title}"`;
    try {
      const result = await generateLessonForNode(node.id, DEMO_MASJID_ID, { force });
      console.log(
        `✓ ${label}\n  source=${result.source} regenerated=${result.regenerated} ` +
          `objectives=${result.lesson.objectives.length} practice=${result.lesson.practice.length}\n`,
      );
    } catch (err) {
      failures += 1;
      console.error(`✗ ${label}\n  ${err instanceof Error ? err.message : err}\n`);
    }
  }

  if (failures > 0) {
    throw new Error(`${failures} lesson(s) failed to generate`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
