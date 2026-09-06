/**
 * Prove tenant isolation is enforced at the DATABASE, not just in app code (T31).
 *
 *   npm run check:rls
 *
 * Uses three lenses on the same data:
 *   - service-role client  -> sees everything (baseline)
 *   - anon client, no auth -> must see nothing on RLS-protected tables
 *   - anon client signed in as the demo parent -> must see ONLY their masjid,
 *     even after a second masjid is inserted behind their back.
 *
 * Exits non-zero on any failure. Read-only except for a throwaway second masjid
 * that is created and then deleted within the run.
 */

import { createClient } from "@supabase/supabase-js";
import { getServiceClient } from "@/lib/db";
import { env } from "@/lib/env";
import { DEMO_MASJID_ID } from "@/lib/auth";

const DEMO_PARENT_EMAIL = "parent@suffa.demo";
const DEMO_PARENT_PASSWORD = process.env.SUFFA_DEMO_PASSWORD || "suffademo1234";

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "  PASS" : "  FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures += 1;
}

async function main() {
  const svc = getServiceClient();
  const anon = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // --- baseline: service-role sees the demo masjid's data ---
  const svcUsers = await svc
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("masjid_id", DEMO_MASJID_ID);
  check("service-role sees demo-masjid users", (svcUsers.count ?? 0) > 0, `count=${svcUsers.count}`);

  // --- anon with no session: RLS-protected tables return nothing ---
  for (const table of ["users", "pods", "checkpoint_results", "masjids", "waqf_ledger"]) {
    const r = await anon.from(table).select("*").limit(5);
    const rows = r.data?.length ?? 0;
    check(`anon (no auth) sees 0 rows in ${table}`, rows === 0, r.error ? `error: ${r.error.message}` : `rows=${rows}`);
  }

  // --- anon signed in as the demo parent ---
  const signIn = await anon.auth.signInWithPassword({
    email: DEMO_PARENT_EMAIL,
    password: DEMO_PARENT_PASSWORD,
  });
  if (signIn.error || !signIn.data.session) {
    check("sign in as demo parent", false, signIn.error?.message ?? "no session");
    console.log("\nCannot continue without a parent session. Run `npm run seed:auth`.");
    process.exit(1);
  }
  check("sign in as demo parent", true);

  const authed = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${signIn.data.session.access_token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const seesOwnMasjid = await authed.from("masjids").select("id");
  check(
    "parent sees exactly their own masjid",
    !seesOwnMasjid.error &&
      seesOwnMasjid.data?.length === 1 &&
      seesOwnMasjid.data[0].id === DEMO_MASJID_ID,
    seesOwnMasjid.error ? seesOwnMasjid.error.message : `rows=${JSON.stringify(seesOwnMasjid.data)}`,
  );

  const authedUsers = await authed.from("users").select("id, masjid_id");
  const allOwn =
    !authedUsers.error &&
    (authedUsers.data?.length ?? 0) > 0 &&
    authedUsers.data!.every((u) => u.masjid_id === DEMO_MASJID_ID);
  check("parent sees only their masjid's users", allOwn, `rows=${authedUsers.data?.length}`);

  const authedResults = await authed.from("checkpoint_results").select("id").limit(1);
  check(
    "parent can read checkpoint_results in-tenant (policy grants, not just denies)",
    !authedResults.error,
    authedResults.error ? authedResults.error.message : `rows=${authedResults.data?.length}`,
  );

  // --- cross-tenant: insert a second masjid + user, confirm invisibility ---
  const M2 = "00000000-0000-0000-0000-0000000000f2";
  await svc.from("masjids").delete().eq("id", M2); // clean slate
  const mkMasjid = await svc.from("masjids").insert({ id: M2, name: "RLS Test Masjid" });
  const mkUser = await svc.from("users").insert({
    masjid_id: M2,
    role: "admin",
    name: "RLS Test Admin",
    email: `rls-test-${Date.now()}@example.invalid`,
  });
  if (mkMasjid.error || mkUser.error) {
    check("seed throwaway second masjid", false, mkMasjid.error?.message ?? mkUser.error?.message);
  } else {
    check("seed throwaway second masjid", true);

    const afterMasjids = await authed.from("masjids").select("id");
    check(
      "parent STILL sees only 1 masjid after a 2nd exists",
      afterMasjids.data?.length === 1 && afterMasjids.data[0].id === DEMO_MASJID_ID,
      `rows=${JSON.stringify(afterMasjids.data)}`,
    );

    const afterUsers = await authed.from("users").select("masjid_id");
    check(
      "parent sees no users from the 2nd masjid",
      !afterUsers.error && afterUsers.data!.every((u) => u.masjid_id === DEMO_MASJID_ID),
      `foreign rows=${afterUsers.data?.filter((u) => u.masjid_id === M2).length}`,
    );
  }

  // cleanup (cascade removes the M2 user)
  await svc.from("masjids").delete().eq("id", M2);
  await anon.auth.signOut();

  console.log(
    failures === 0
      ? "\nRLS OK — cross-tenant reads are refused at the database.\n"
      : `\n${failures} RLS check(s) FAILED.\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
