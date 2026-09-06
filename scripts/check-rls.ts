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

  const authedResults = await authed
    .from("checkpoint_results")
    .select("id, student_user_id");
  check(
    "parent can read checkpoint_results in-tenant (policy grants, not just denies)",
    !authedResults.error,
    authedResults.error ? authedResults.error.message : `rows=${authedResults.data?.length}`,
  );

  // T82 relationship-scope: the demo parent is linked to Yusuf (…c1) only. They
  // must NOT see checkpoint_results for the other pod students (…c2/c3/c4).
  const { data: myKids } = await svc
    .from("parent_children")
    .select("student_user_id, parent:users!parent_children_parent_user_id_fkey ( email )")
    .eq("parent.email", DEMO_PARENT_EMAIL);
  const linked = new Set((myKids ?? []).map((r) => r.student_user_id as string));
  const foreign = (authedResults.data ?? []).filter(
    (r) => !linked.has(r.student_user_id as string),
  ).length;
  check(
    "parent sees checkpoint_results for their linked children ONLY",
    !authedResults.error && foreign === 0 && linked.size > 0,
    `linked=${linked.size} foreign_rows=${foreign}`,
  );

  // --- cross-tenant: insert a second masjid + user, confirm invisibility ---
  const M2 = "00000000-0000-0000-0000-0000000000f2";
  await svc.from("masjids").delete().eq("id", M2); // clean slate
  const mkMasjid = await svc.from("masjids").insert({ id: M2, name: "RLS Test Masjid" });
  const mkUser = await svc
    .from("users")
    .insert({
      masjid_id: M2,
      role: "student",
      name: "RLS Test Student",
      email: `rls-test-${Date.now()}@example.invalid`,
    })
    .select("id")
    .single();
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

    // --- WRITE policies (T79) ---
    const M2StudentId = mkUser.data!.id as string;
    const { data: anyNode } = await svc
      .from("pathway_nodes")
      .select("id")
      .limit(1)
      .maybeSingle();

    // 1) cross-tenant write: parent inserts a result for a student in M2 -> refused
    const crossWrite = await authed.from("checkpoint_results").insert({
      student_user_id: M2StudentId,
      pathway_node_id: anyNode?.id ?? "00000000-0000-0000-0000-0000000000e0",
      passed: true,
    });
    check(
      "parent CANNOT write a checkpoint_result for a student in another masjid",
      crossWrite.error != null,
      crossWrite.error ? `refused: ${crossWrite.error.message}` : "INSERT SUCCEEDED — LEAK",
    );

    // 2) privileged in-tenant write by a non-admin: parent inserts a ledger row -> refused
    const ledgerWrite = await authed.from("waqf_ledger").insert({
      masjid_id: DEMO_MASJID_ID,
      entry_type: "sadaqah_received",
      amount: 1,
      note: "rls-test",
    });
    check(
      "parent (non-admin) CANNOT write waqf_ledger in their own masjid",
      ledgerWrite.error != null,
      ledgerWrite.error ? `refused: ${ledgerWrite.error.message}` : "INSERT SUCCEEDED — LEAK",
    );
    // belt-and-braces: make sure nothing landed
    await svc.from("waqf_ledger").delete().eq("note", "rls-test").eq("masjid_id", DEMO_MASJID_ID);
  }

  // --- T83: the user-action writes that now run on the authed client ---
  // Sign in as the demo STUDENT and prove they can write their own result but
  // not another student's, through the same authed client the app now uses.
  await anon.auth.signOut();
  const stSignIn = await anon.auth.signInWithPassword({
    email: "student@suffa.demo",
    password: DEMO_PARENT_PASSWORD,
  });
  if (stSignIn.data.session) {
    const stAuthed = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${stSignIn.data.session.access_token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: selfId } = await stAuthed.rpc("app_user_id");
    const { data: node } = await svc.from("pathway_nodes").select("id").limit(1).single();
    const { data: otherKid } = await svc
      .from("users")
      .select("id")
      .eq("masjid_id", DEMO_MASJID_ID)
      .eq("role", "student")
      .neq("id", (selfId as string) ?? "")
      .limit(1)
      .maybeSingle();

    const selfWrite = await stAuthed.from("checkpoint_results").insert({
      student_user_id: selfId,
      pathway_node_id: node!.id,
      passed: true,
      answer_data: { rls: "self-write-test" },
    });
    check(
      "student CAN write their own checkpoint_result via the authed client",
      !selfWrite.error,
      selfWrite.error ? selfWrite.error.message : "inserted",
    );
    await svc
      .from("checkpoint_results")
      .delete()
      .eq("student_user_id", selfId as string)
      .contains("answer_data", { rls: "self-write-test" });

    if (otherKid?.id) {
      const otherWrite = await stAuthed.from("checkpoint_results").insert({
        student_user_id: otherKid.id,
        pathway_node_id: node!.id,
        passed: true,
      });
      check(
        "student CANNOT write another in-masjid student's checkpoint_result",
        otherWrite.error != null,
        otherWrite.error ? `refused: ${otherWrite.error.message}` : "INSERT SUCCEEDED — LEAK",
      );
    }
    await anon.auth.signOut();
  } else {
    check("sign in as demo student", false, stSignIn.error?.message ?? "no session");
  }

  // cleanup (cascade removes the M2 user)
  await svc.from("masjids").delete().eq("id", M2);
  await anon.auth.signOut();

  console.log(
    failures === 0
      ? "\nRLS OK — cross-tenant reads AND writes are refused at the database.\n"
      : `\n${failures} RLS check(s) FAILED.\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
