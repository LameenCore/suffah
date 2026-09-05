// GET /api/transcript/[studentId]?format=json|csv
//
// Machine-readable term-completion record (T49). Available to an admin in the
// masjid or a parent linked to the student.

import { getCurrentUser } from "@/lib/auth";
import { getServiceClient } from "@/lib/db";
import { assertCanViewStudent } from "@/lib/db/access";
import { assembleTranscript, transcriptToCsv } from "@/lib/transcript";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "not signed in" }, { status: 401 });

  const { studentId } = await params;
  try {
    await assertCanViewStudent(user, studentId);
  } catch {
    return Response.json({ error: "not permitted" }, { status: 403 });
  }

  const { data: row } = await getServiceClient()
    .from("users")
    .select("name")
    .eq("id", studentId)
    .maybeSingle();
  const name = (row?.name as string | undefined) ?? "Student";

  const transcript = await assembleTranscript(studentId, name, user.masjidId);

  const format = new URL(request.url).searchParams.get("format") ?? "json";
  if (format === "csv") {
    return new Response(transcriptToCsv(transcript), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="transcript-${studentId}.csv"`,
      },
    });
  }
  return Response.json(transcript);
}
