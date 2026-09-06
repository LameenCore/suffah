/**
 * Populate the shared reference curriculum (T81) from the demo masjid.
 *
 *   npm run seed:reference
 *
 * The reference masjid (migration 0024) holds a ready-made Secondary 1 curriculum
 * that new masjids can adopt/fork. It is seeded by deep-copying the demo masjid's
 * courses / units / pathway_nodes (with any generated lesson + checkpoint
 * content). Re-runnable: a course already present in the reference masjid is
 * skipped.
 */

import { copyCurriculum, REFERENCE_MASJID_ID } from "@/lib/platform/reference-curriculum";
import { DEMO_MASJID_ID } from "@/lib/auth";
import { getServiceClient } from "@/lib/db";

async function main() {
  const { data: ref } = await getServiceClient()
    .from("masjids")
    .select("id, kind")
    .eq("id", REFERENCE_MASJID_ID)
    .maybeSingle();
  if (!ref) {
    console.error("Reference masjid missing — run `npm run migrate` first.");
    process.exit(1);
  }

  const r = await copyCurriculum(DEMO_MASJID_ID, REFERENCE_MASJID_ID);
  console.log(
    `Reference curriculum: ${r.coursesCopied} course(s), ${r.nodesCopied} node(s) copied` +
      (r.skipped.length ? `; skipped (already present): ${r.skipped.join(", ")}` : ""),
  );
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
