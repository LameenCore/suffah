/**
 * Generate + persist the term exam for every course in the demo masjid.
 * Run after gen:lessons.
 *
 *   npm run gen:exams
 *   npm run gen:exams -- --force
 */

import { DEMO_MASJID_ID } from "@/lib/auth";
import { DEMO_TERM_LABEL } from "@/lib/types";
import { getServiceClient } from "@/lib/db";
import { generateTermExam } from "@/lib/ai/term-exam";

async function main() {
  const force = process.argv.includes("--force");

  const { data, error } = await getServiceClient()
    .from("courses")
    .select("id, name, masjid_id")
    .eq("masjid_id", DEMO_MASJID_ID)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  const courses = (data ?? []) as { id: string; name: string }[];
  if (courses.length === 0) throw new Error("No courses - run npm run seed first.");

  console.log(
    `Generating "${DEMO_TERM_LABEL}" term exams for ${courses.length} course(s)${
      force ? " (force)" : ""
    }...\n`,
  );

  let failures = 0;
  for (const c of courses) {
    try {
      const r = await generateTermExam(c.id, DEMO_TERM_LABEL, DEMO_MASJID_ID, { force });
      console.log(
        `✓ ${c.name}\n  source=${r.source} questions=${r.content.questions.length} ` +
          `duration=${Math.round(r.content.durationSeconds / 60)}min covers=${r.content.coversTitles.length}\n`,
      );
    } catch (err) {
      failures += 1;
      console.error(`✗ ${c.name}\n  ${err instanceof Error ? err.message : err}\n`);
    }
  }

  if (failures > 0) throw new Error(`${failures} term exam(s) failed`);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
