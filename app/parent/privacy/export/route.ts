// GET /parent/privacy/export
//
// Law 25 access + portability (T36): returns everything Suffa holds about the
// signed-in guardian's family as a JSON attachment. Read-only; scoped to the
// guardian's own linked children within their masjid.

import { getCurrentUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { exportFamilyData } from "@/lib/db/privacy-queries";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "not signed in" }, { status: 401 });
  if (user.role !== "parent") {
    return Response.json({ error: "parent role required" }, { status: 403 });
  }

  try {
    const data = await exportFamilyData(user);
    await recordAudit({
      actor: user,
      action: "privacy.data_exported",
      targetType: "guardian",
      targetId: user.id,
      metadata: { childCount: data.children.length },
    });

    const stamp = new Date().toISOString().slice(0, 10);
    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="suffa-data-export-${stamp}.json"`,
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    console.error("[/parent/privacy/export]", err);
    const message = err instanceof Error ? err.message : "export failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
