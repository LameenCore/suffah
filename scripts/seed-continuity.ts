/**
 * Seed a few realistic session notes for the demo pod and generate its first
 * handoff briefing, so the Continuity Fingerprint view (T18) has something to
 * show out of the box.
 *
 *   npm run seed:continuity
 *   npm run seed:continuity -- --reset   # clear existing notes/briefings first
 *
 * Safe to re-run. Needs the DB + Anthropic keys in .env.local.
 */

import { DEMO_MASJID_ID } from "@/lib/auth";
import { getServiceClient } from "@/lib/db";
import { addPodSessionNote } from "@/lib/db/continuity-queries";
import { generatePodBriefing } from "@/lib/ai/continuity";

const POD = "00000000-0000-0000-0000-0000000000e1"; // Pod Al-Farabi
const COURSE = {
  math: "00000000-0000-0000-0000-0000000000f1",
  seerah: "00000000-0000-0000-0000-0000000000f2",
  ai: "00000000-0000-0000-0000-0000000000f3",
};

const NOTES: { note: string; courseId: string | null; author: string }[] = [
  {
    note: "Group session went well - Yusuf explained integer signs to Idris using a number line drawn on the whiteboard; that clicked for the whole pod.",
    courseId: COURSE.math,
    author: "Br. Kareem",
  },
  {
    note: "Maryam keeps rushing the checkpoint and missing negative signs. Slowed her down by asking her to say each step out loud.",
    courseId: COURSE.math,
    author: "Br. Kareem",
  },
  {
    note: "Seerah discussion on Meccan society was lively - Safiya asked good questions about why tribe mattered so much. Consider a map next time.",
    courseId: COURSE.seerah,
    author: "Br. Kareem",
  },
  {
    note: "AI literacy: the 'confident but wrong' idea landed best with a live example - I asked the class chatbot something it got wrong and we caught it together.",
    courseId: COURSE.ai,
    author: "Br. Kareem",
  },
  {
    note: "Attendance solid this week - all four present both sessions. Idris was quiet on Thursday, worth a check-in.",
    courseId: null,
    author: "Br. Kareem",
  },
];

const MASJID = "00000000-0000-0000-0000-000000000001";

async function main() {
  const reset = process.argv.includes("--reset");
  const db = getServiceClient();

  if (reset) {
    await db.from("pod_briefings").delete().eq("pod_id", POD);
    await db.from("pod_session_notes").delete().eq("pod_id", POD);
    console.log("Cleared existing notes + briefings for the demo pod.");
  }

  // A standby volunteer so the live handoff simulation (T19) has someone to hand
  // off TO. Unassigned; the seed pod keeps Br. Kareem.
  const { data: standby } = await db
    .from("volunteers")
    .select("id")
    .eq("masjid_id", MASJID)
    .eq("name", "Sr. Amina Diallo")
    .maybeSingle();
  if (!standby) {
    await db.from("volunteers").insert({
      masjid_id: MASJID,
      name: "Sr. Amina Diallo",
      status: "active",
      certification_note: "Former Sec-1 teacher; available as a substitute (mock).",
    });
    console.log("Added standby volunteer: Sr. Amina Diallo.");
  }

  const { count } = await db
    .from("pod_session_notes")
    .select("id", { count: "exact", head: true })
    .eq("pod_id", POD)
    .eq("author_kind", "volunteer");

  if ((count ?? 0) === 0) {
    for (const n of NOTES) {
      await addPodSessionNote(POD, DEMO_MASJID_ID, {
        note: n.note,
        authorKind: "volunteer",
        authorName: n.author,
        courseId: n.courseId,
      });
    }
    console.log(`Inserted ${NOTES.length} session notes.`);
  } else {
    console.log(`Pod already has ${count} volunteer note(s) - skipping insert.`);
  }

  const result = await generatePodBriefing(POD, DEMO_MASJID_ID);
  console.log(`\nBriefing generated (source=${result.source}):\n`);
  console.log("  " + result.briefing.headline);
  for (const c of result.briefing.perCourse) {
    console.log(`  ${c.course}: ${c.status} - ${c.note}`);
  }
  console.log("\n  Watch for:");
  for (const w of result.briefing.watchFor) console.log("   -", w);
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
