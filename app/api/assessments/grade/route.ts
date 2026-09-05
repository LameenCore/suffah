// POST /api/assessments/grade  { unitId: string, answers: Record<string, string> }
//
// Grades a submitted unit assessment and persists the attempt to
// unit_assessment_results. Returns the persisted grade.

import { getCurrentUser } from "@/lib/auth";
import { getUnitCheckpointProgress } from "@/lib/db/queries";
import { gradeUnitAssessment } from "@/lib/ai/assessment";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "not signed in" }, { status: 401 });
  if (user.role !== "student") {
    return Response.json({ error: "only a student can submit an assessment" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const { unitId, answers } = (body ?? {}) as { unitId?: unknown; answers?: unknown };
  if (typeof unitId !== "string" || unitId.length === 0) {
    return Response.json({ error: "unitId is required" }, { status: 400 });
  }
  if (typeof answers !== "object" || answers === null || Array.isArray(answers)) {
    return Response.json({ error: "answers must be an object" }, { status: 400 });
  }
  const normalized: Record<string, string> = {};
  for (const [k, v] of Object.entries(answers)) normalized[k] = String(v);

  try {
    const progress = await getUnitCheckpointProgress(user.id, unitId, user.masjidId);
    if (!progress.complete) {
      return Response.json(
        { error: "pass every checkpoint in the unit before the unit assessment" },
        { status: 409 },
      );
    }
    const grade = await gradeUnitAssessment(unitId, user.id, user.masjidId, normalized);
    return Response.json(grade);
  } catch (err) {
    if (err instanceof Error && err.name === "UnitNotFoundError") {
      return Response.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof Error && err.name === "AssessmentMissingError") {
      return Response.json({ error: err.message }, { status: 409 });
    }
    console.error("[/api/assessments/grade]", err);
    const message = err instanceof Error ? err.message : "grading failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
