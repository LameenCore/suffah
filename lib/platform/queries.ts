// Cross-masjid operational rollup for /platform (T33). Aggregate COUNTs / SUMs
// only — no student names, no per-student rows, no PII. Service-role (the
// caller is already verified as a platform admin).

import { getServiceClient } from "@/lib/db";

export interface MasjidRow {
  id: string;
  name: string;
  defaultLocale: string;
  status: "active" | "suspended";
  createdAt: string | null;
  students: number;
  pods: number;
  volunteersActive: number;
  volunteersDeparted: number;
  churnRate: number; // departed / (active + departed)
  aiSpendMonthUsd: number;
  waqfPrincipalUsd: number;
}

const monthStartIso = () => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
};

export async function getPlatformOverview(): Promise<MasjidRow[]> {
  const db = getServiceClient();
  const { data: masjids, error } = await db
    .from("masjids")
    .select("id, name, default_locale, status, created_at")
    .eq("kind", "tenant")   // exclude the shared-curriculum reference masjid (T81)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`masjids: ${error.message}`);

  const since = monthStartIso();

  return Promise.all(
    (masjids ?? []).map(async (m) => {
      const id = m.id as string;
      const [students, pods, vActive, vDeparted, spend, ledger] = await Promise.all([
        db
          .from("users")
          .select("id", { count: "exact", head: true })
          .eq("masjid_id", id)
          .eq("role", "student"),
        db.from("pods").select("id", { count: "exact", head: true }).eq("masjid_id", id),
        db
          .from("volunteers")
          .select("id", { count: "exact", head: true })
          .eq("masjid_id", id)
          .is("left_at", null),
        db
          .from("volunteers")
          .select("id", { count: "exact", head: true })
          .eq("masjid_id", id)
          .not("left_at", "is", null),
        db.from("model_call_log").select("cost_usd").eq("masjid_id", id).gte("at", since),
        db.from("waqf_ledger").select("amount, entry_type").eq("masjid_id", id),
      ]);

      const active = vActive.count ?? 0;
      const departed = vDeparted.count ?? 0;
      const aiSpendMonthUsd = ((spend.data ?? []) as { cost_usd: number }[]).reduce(
        (s, r) => s + Number(r.cost_usd ?? 0),
        0,
      );
      const waqfPrincipalUsd = ((ledger.data ?? []) as { amount: number; entry_type: string }[])
        .filter((r) => r.entry_type === "principal_deposit")
        .reduce((s, r) => s + Number(r.amount ?? 0), 0);

      return {
        id,
        name: m.name as string,
        defaultLocale: (m.default_locale as string) ?? "en",
        status: (m.status as "active" | "suspended") ?? "active",
        createdAt: (m.created_at as string | null) ?? null,
        students: students.count ?? 0,
        pods: pods.count ?? 0,
        volunteersActive: active,
        volunteersDeparted: departed,
        churnRate: active + departed > 0 ? departed / (active + departed) : 0,
        aiSpendMonthUsd,
        waqfPrincipalUsd,
      } satisfies MasjidRow;
    }),
  );
}

export async function getMasjidDetail(masjidId: string): Promise<MasjidRow | null> {
  const all = await getPlatformOverview();
  return all.find((m) => m.id === masjidId) ?? null;
}

export async function setMasjidStatus(
  masjidId: string,
  status: "active" | "suspended",
): Promise<void> {
  const { error } = await getServiceClient()
    .from("masjids")
    .update({ status })
    .eq("id", masjidId);
  if (error) throw new Error(`setMasjidStatus: ${error.message}`);
}
