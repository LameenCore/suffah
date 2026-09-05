/**
 * Generate + persist the checkpoint for the first node of every course (the
 * nodes `npm run gen:lessons` prepared). Run that first.
 *
 *   npm run gen:checkpoints
 *   npm run gen:checkpoints -- --force
 */

import { DEMO_MASJID_ID } from "@/lib/auth";
import { getFirstNodePerCourse } from "@/lib/db/queries";
import { generateCheckpointForNode } from "@/lib/ai/checkpoint";

async function main() {
  const force = process.argv.includes("--force");
  const nodes = await getFirstNodePerCourse(DEMO_MASJID_ID);
  if (nodes.length === 0) throw new Error("No pathway nodes found - run npm run seed first.");

  console.log(`Generating checkpoints for ${nodes.length} node(s)${force ? " (force)" : ""}…\n`);

  let failures = 0;
  for (const node of nodes) {
    const label = `${node.course.name} · node ${node.sequence_order} · "${node.title}"`;
    if (!node.lesson_content) {
      failures += 1;
      console.error(`✗ ${label}\n  no lesson yet - run npm run gen:lessons\n`);
      continue;
    }
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
