/**
 * Seed a believable spread of student results for the walkthrough. The demo
 * student (Yusuf - the default `student` dev role, and the parent's linked child)
 * is left FRESH on Math so demo step 1 (complete a lesson + checkpoint live)
 * works. The other three carry the on-track / watch / gap spread that makes the
 * compliance report worth showing.
 *
 *   npm run seed:progress            # insert (skips if results already exist)
 *   npm run seed:progress -- --reset # wipe + re-seed this pod's demo state
 *
 * With --reset this delegates to lib/demo/reset.ts, the same function the in-app
 * "Reset walkthrough" button uses, so the two never drift.
 */

import { getServiceClient } from "@/lib/db";
import { DEMO_MASJID_ID } from "@/lib/auth";
import { resetWalkthroughState } from "@/lib/demo/reset";

const STUDENTS = [
  "00000000-0000-0000-0000-0000000000c1",
  "00000000-0000-0000-0000-0000000000c2",
  "00000000-0000-0000-0000-0000000000c3",
  "00000000-0000-0000-0000-0000000000c4",
];

async function main() {
  const reset = process.argv.includes("--reset");

  if (reset) {
    const summary = await resetWalkthroughState(DEMO_MASJID_ID);
    console.log(`Reset demo walkthrough state (${summary.clearedFor.join(", ")}).`);
    console.log("Yusuf is fresh on Math for the walkthrough.");
    return;
  }

  const { count } = await getServiceClient()
    .from("checkpoint_results")
    .select("id", { count: "exact", head: true })
    .in("student_user_id", STUDENTS);
  if ((count ?? 0) > 0) {
    console.log(`Pod already has ${count} checkpoint result(s) - pass --reset to redo.`);
    return;
  }

  // No results yet: a reset produces exactly the spread we want from a clean pod.
  const summary = await resetWalkthroughState(DEMO_MASJID_ID);
  console.log(`Seeded demo results (${summary.clearedFor.join(", ")}).`);
  console.log("Yusuf is fresh on Math for the walkthrough.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
