/**
 * Create the three demo login accounts and link them to the seeded `users` rows.
 *
 *   npm run seed:auth
 *
 * Needs the service-role key + SUPABASE_DB_URL in .env.local, migration 0009
 * applied, and `npm run seed` already run (the a1/b1/c1 users must exist).
 * Idempotent: deletes any existing auth user with these emails first.
 *
 * Password for all three: SUFFA_DEMO_PASSWORD env var, or "suffademo1234".
 */

import { getServiceClient } from "@/lib/db";
import { DEMO_USERS } from "@/lib/auth";

const PASSWORD = process.env.SUFFA_DEMO_PASSWORD || "suffademo1234";

async function main() {
  const db = getServiceClient();

  // List existing auth users once (admin API paginates; one page is plenty here).
  const { data: existing, error: listErr } = await db.auth.admin.listUsers({ perPage: 200 });
  if (listErr) throw new Error(`listUsers: ${listErr.message}`);

  for (const demo of Object.values(DEMO_USERS)) {
    const prior = existing.users.find((u) => u.email?.toLowerCase() === demo.email.toLowerCase());
    if (prior) {
      await db.auth.admin.deleteUser(prior.id);
    }

    const { data: created, error } = await db.auth.admin.createUser({
      email: demo.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { name: demo.name, role: demo.role },
    });
    if (error || !created.user) throw new Error(`createUser ${demo.email}: ${error?.message}`);

    const { error: linkErr } = await db
      .from("users")
      .update({ auth_id: created.user.id })
      .eq("id", demo.id);
    if (linkErr) throw new Error(`link ${demo.email}: ${linkErr.message}`);

    console.log(`  ${demo.role.padEnd(7)} ${demo.email}  ->  users.${demo.id.slice(-2)}`);
  }

  console.log(`\nDone. Sign in at /login with any of the above and password: ${PASSWORD}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
