/**
 * Generate + persist the unit assessment for every unit in the demo masjid.
 * Run after gen:lessons (the assessment is built from the unit's lessons).
 *
 *   npm run gen:assessments
 *   npm run gen:assessments -- --force
 */

import { DEMO_MASJID_ID } from "@/lib/auth";
import { getServiceClient } from "@/lib/db";
import { generateUnitAssessment } from "@/lib/ai/assessment";

async function main() {
  const force = process.argv.includes("--force");

  const { data, error } = await getServiceClient()
    .from("units")
    .select("id, title, course:courses!inner ( name, masjid_id )");
  if (error) throw new Error(error.message);

  const units = (data ?? []).filter((u) => {
    const c = Array.isArray(u.course) ? u.course[0] : u.course;
    return c?.masjid_id === DEMO_MASJID_ID;
  });
  if (units.length === 0) throw new Error("No units found - run npm run seed first.");

  console.log(`Generating assessments for ${units.length} unit(s)${force ? " (force)" : ""}...\n`);

  let failures = 0;
  for (const u of units) {
    const c = Array.isArray(u.course) ? u.course[0] : u.course;
    const label = `${c?.name} · "${u.title}"`;
    try {
      const result = await generateUnitAssessment(u.id as string, DEMO_MASJID_ID, { force });
      console.log(
        `✓ ${label}\n  source=${result.source} regenerated=${result.regenerated} ` +
          `questions=${result.assessment.questions.length} covers=${result.assessment.coversTitles.length}\n`,
      );
    } catch (err) {
      failures += 1;
      console.error(`✗ ${label}\n  ${err instanceof Error ? err.message : err}\n`);
    }
  }

  if (failures > 0) throw new Error(`${failures} assessment(s) failed`);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
