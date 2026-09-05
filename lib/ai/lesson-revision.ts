// Fold community contributions into a persisted lesson (T22).
//
// Hackathon scope ("mock"): a deterministic merge - the scholars'/elders' text
// notes are appended as a "Community input" section and the lesson's
// communityRevision.version is bumped. Productionization step (stated in the
// pitch): send the current lesson JSON + the notes to the model for a real
// rewrite. The persistence + versioning + "revised with community input"
// contract here is identical either way.

import { saveLessonContent } from "@/lib/db/queries";
import { getPathwayNode } from "@/lib/db/queries";
import type { LessonContent } from "@/lib/ai/lesson";
import type { CommunityRevision } from "@/lib/db/contribution-queries";
import { getServiceClient } from "@/lib/db";

export interface IncorporateResult {
  version: number;
  incorporatedCount: number;
}

type RevisableLesson = LessonContent & { communityRevision?: CommunityRevision };

export async function incorporateContributions(
  nodeId: string,
  masjidId: string,
): Promise<IncorporateResult> {
  const node = await getPathwayNode(nodeId, masjidId);
  if (!node) throw new Error("node not found in this masjid");
  if (!node.lesson_content) {
    throw new Error("generate the lesson before incorporating contributions");
  }
  const lesson = node.lesson_content as RevisableLesson;

  const db = getServiceClient();
  const { data: pending, error } = await db
    .from("lesson_contributions")
    .select("id, contributor_name, contributor_role, note")
    .eq("node_id", nodeId)
    .eq("incorporated", false)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`incorporateContributions: ${error.message}`);
  if (!pending || pending.length === 0) {
    throw new Error("no pending community contributions for this lesson");
  }

  const incoming = pending.map((c) => ({
    name: c.contributor_name as string,
    role: (c.contributor_role as string | null) ?? null,
    note: c.note as string,
  }));

  const bullets = incoming
    .map((c) => `• ${c.name}${c.role ? ` (${c.role})` : ""}: ${c.note}`)
    .join("\n");

  const sections = [...lesson.sections];
  const existingIdx = sections.findIndex((s) => s.heading === "Community input");
  if (existingIdx >= 0) {
    sections[existingIdx] = {
      ...sections[existingIdx],
      body: `${sections[existingIdx].body}\n${bullets}`,
    };
  } else {
    sections.push({
      heading: "Community input",
      body: `Added by the masjid's scholars and elders:\n${bullets}`,
    });
  }

  const prevVersion = lesson.communityRevision?.version ?? 1;
  const priorIncorporated = lesson.communityRevision?.incorporated ?? [];
  const nextVersion = prevVersion + 1;

  const revised = {
    ...lesson,
    sections,
    communityRevision: {
      version: nextVersion,
      revisedAt: new Date().toISOString(),
      incorporated: [...priorIncorporated, ...incoming],
    },
  } as LessonContent;

  await saveLessonContent(nodeId, masjidId, revised);

  const { error: upErr } = await db
    .from("lesson_contributions")
    .update({ incorporated: true })
    .in(
      "id",
      pending.map((c) => c.id as string),
    );
  if (upErr) throw new Error(`incorporateContributions: ${upErr.message}`);

  return { version: nextVersion, incorporatedCount: incoming.length };
}
