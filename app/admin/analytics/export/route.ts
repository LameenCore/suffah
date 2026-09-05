// GET /admin/analytics/export — the learning-analytics numbers as a CSV
// attachment. Admin-only, aggregate, no per-student rows.

import { getCurrentUser } from "@/lib/auth";
import { getLearningAnalytics, analyticsToCsv } from "@/lib/db/analytics-queries";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "not signed in" }, { status: 401 });
  if (user.role !== "admin") {
    return Response.json({ error: "admin role required" }, { status: 403 });
  }

  try {
    const csv = analyticsToCsv(await getLearningAnalytics(user.masjidId));
    const stamp = new Date().toISOString().slice(0, 10);
    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="suffa-analytics-${stamp}.csv"`,
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    console.error("[/admin/analytics/export]", err);
    const message = err instanceof Error ? err.message : "export failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
