// Provision a new masjid: the tenant row, its first admin login, and a starter
// curriculum skeleton (T33). Service-role; callers must already be a verified
// platform admin.

import { getServiceClient } from "@/lib/db";
import { seedCurriculumSkeleton } from "@/lib/platform/seed-masjid";
import { isLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

export interface ProvisionInput {
  name: string;
  defaultLocale: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export interface ProvisionResult {
  masjidId: string;
  adminUserId: string;
}

export async function provisionMasjid(input: ProvisionInput): Promise<ProvisionResult> {
  const name = input.name.trim();
  const adminName = input.adminName.trim();
  const adminEmail = input.adminEmail.trim().toLowerCase();
  const locale: Locale = isLocale(input.defaultLocale)
    ? (input.defaultLocale as Locale)
    : DEFAULT_LOCALE;

  if (!name) throw new Error("Masjid name is required.");
  if (!adminName) throw new Error("Admin name is required.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(adminEmail)) throw new Error("Enter a valid admin email.");
  if (input.adminPassword.length < 8) throw new Error("Admin password must be at least 8 characters.");

  const db = getServiceClient();

  const { data: masjid, error: mErr } = await db
    .from("masjids")
    .insert({ name, default_locale: locale })
    .select("id")
    .single();
  if (mErr || !masjid) throw new Error(`create masjid: ${mErr?.message}`);
  const masjidId = masjid.id as string;

  const rollbackMasjid = async () => {
    await db.from("masjids").delete().eq("id", masjidId);
  };

  const { data: authUser, error: aErr } = await db.auth.admin.createUser({
    email: adminEmail,
    password: input.adminPassword,
    email_confirm: true,
    user_metadata: { name: adminName, role: "admin" },
  });
  if (aErr || !authUser.user) {
    await rollbackMasjid();
    throw new Error(`create admin login: ${aErr?.message ?? "unknown"}`);
  }
  const authId = authUser.user.id;

  const { data: userRow, error: uErr } = await db
    .from("users")
    .insert({
      masjid_id: masjidId,
      role: "admin",
      name: adminName,
      email: adminEmail,
      auth_id: authId,
    })
    .select("id")
    .single();
  if (uErr || !userRow) {
    await db.auth.admin.deleteUser(authId);
    await rollbackMasjid();
    throw new Error(`link admin user: ${uErr?.message}`);
  }

  try {
    await seedCurriculumSkeleton(masjidId);
  } catch (err) {
    // Curriculum is recoverable; leave the masjid + admin in place but surface it.
    throw new Error(
      `masjid + admin created (id ${masjidId}) but the curriculum skeleton failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  return { masjidId, adminUserId: userRow.id as string };
}
