/**
 * Generate + persist checkpoints for the demo masjid. Run gen:lessons first.
 *
 *   npm run gen:checkpoints            # every node that has a lesson (whole demo)
 *   npm run gen:checkpoints -- --first # only node 1 of each course
 *   npm run gen:checkpoints -- --force # regenerate
 */

import { DEMO_MASJID_ID } from "@/lib/auth";
import { getFirstNodePerCourse, getAllPathwayNodes } from "@/lib/db/queries";
import { generateCheckpointForNode } from "@/lib/ai/checkpoint";

async function main() {
  const force = process.argv.includes("--force");
  const firstOnly = process.argv.includes("--first");
  const all = firstOnly
    ? await getFirstNodePerCourse(DEMO_MASJID_ID)
    : await getAllPathwayNodes(DEMO_MASJID_ID);
  if (all.length === 0) throw new Error("No pathway nodes found - run npm run seed first.");
  // Only nodes that have a lesson can get a checkpoint.
  const nodes = all.filter((n) => n.lesson_content);

  console.log(`Generating checkpoints for ${nodes.length} node(s)${force ? " (force)" : ""}...\n`);

  let failures = 0;
  for (const node of nodes) {
    const label = `${node.course.name} - node ${node.sequence_order} - "${node.title}"`;
    try {
      const result = await generateCheckpointForNode(node.id, DEMO_MASJID_ID, { force });
      console.log(
        `✓ ${label}\n  source=${result.source} regenerated=${result.regenerated} ` +
          `questions=${result.checkpoint.questions.length}\n`,
      );
    } catch (err) {
      failures += 1;
      console.error(`✗ ${label}\n  ${err instanceof Error ? err.message : err}\n`);
    }
  }

  if (failures > 0) throw new Error(`${failures} checkpoint(s) failed`);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
