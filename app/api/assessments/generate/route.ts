// POST /api/assessments/generate  { unitId: string, force?: boolean }
//
// Generates (or returns the persisted) unit assessment. Writes to the DB before
// responding. Role- and masjid-scoped at the handler.

import { getCurrentUser } from "@/lib/auth";
import { enforceAiRateLimit } from "@/lib/ratelimit";
import { generateUnitAssessment } from "@/lib/ai/assessment";
import { isLocale } from "@/lib/i18n/config";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "not signed in" }, { status: 401 });
  if (user.role !== "student" && user.role !== "admin") {
    return Response.json({ error: "role not permitted" }, { status: 403 });
  }

  const limited = enforceAiRateLimit("assessment", user);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const { unitId, force, locale } = (body ?? {}) as {
    unitId?: unknown;
    force?: unknown;
    locale?: unknown;
  };
  if (typeof unitId !== "string" || unitId.length === 0) {
    return Response.json({ error: "unitId is required" }, { status: 400 });
  }

  try {
    const result = await generateUnitAssessment(unitId, user.masjidId, {
      force: force === true && user.role === "admin",
      actorUserId: user.id,
      locale: isLocale(locale) ? locale : "en",
    });
    return Response.json({
      unitId: result.unit.id,
      unitTitle: result.unit.title,
      course: result.unit.course.name,
      source: result.source,
      regenerated: result.regenerated,
      questionCount: result.assessment.questions.length,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "UnitNotFoundError") {
      return Response.json({ error: err.message }, { status: 404 });
    }
    console.error("[/api/assessments/generate]", err);
    const message = err instanceof Error ? err.message : "assessment generation failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
