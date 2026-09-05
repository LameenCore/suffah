/**
 * Generate + persist lessons for the demo masjid.
 *
 *   npm run gen:lessons              # every node with no lesson yet (whole demo)
 *   npm run gen:lessons -- --first   # only node 1 of each course (fast)
 *   npm run gen:lessons -- --force   # regenerate
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and ANTHROPIC_API_KEY
 * in .env.local. Nodes past the first have no offline fallback - the model must
 * be reachable for those.
 */

import { DEMO_MASJID_ID } from "@/lib/auth";
import { getFirstNodePerCourse, getAllPathwayNodes } from "@/lib/db/queries";
import { generateLessonForNode } from "@/lib/ai/lesson";

async function main() {
  const force = process.argv.includes("--force");
  const firstOnly = process.argv.includes("--first");

  const nodes = firstOnly
    ? await getFirstNodePerCourse(DEMO_MASJID_ID)
    : await getAllPathwayNodes(DEMO_MASJID_ID);
  if (nodes.length === 0) {
    throw new Error("No pathway nodes found. Run npm run migrate && npm run seed first.");
  }

  console.log(`Generating lessons for ${nodes.length} node(s)${force ? " (force)" : ""}...\n`);

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
