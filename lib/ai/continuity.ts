// Continuity Fingerprint - the volunteer-handoff briefing (T18 / PRD §5.4).
//
// When a volunteer leaves, the next one shouldn't just inherit "Node 4 of Unit 2".
// This generates a short narrative of HOW the pod has been learning - from the
// pod's real progress + checkpoint/assessment history + the session notes
// volunteers leave - and persists it (pod_briefings) so it's a stable artifact,
// not something regenerated on every page view.

import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic, LESSON_MODEL } from "@/lib/ai/client";
import { logModelCall, type TokenUsage } from "@/lib/ai/usage";
import {
  gatherPodLearningSignals,
  saveBriefing,
  getLatestBriefing,
  type PodLearningSignals,
} from "@/lib/db/continuity-queries";

const BriefingSchema = z.object({
  headline: z
    .string()
    .describe("One sentence: where this pod is overall and how it's going."),
  perCourse: z
    .array(
      z.object({
        course: z.string(),
        position: z.string().describe("e.g. 'node 2 of 3'"),
        status: z.enum(["moving well", "some friction", "stuck", "not started"]),
        note: z.string().describe("One line - what's happening in this course."),
      }),
    )
    .describe("One entry per course."),
  students: z
    .array(
      z.object({
        name: z.string(),
        observation: z
          .string()
          .describe("One line - how this student is doing, grounded in the data/notes."),
      }),
    )
    .describe("One entry per student in the pod."),
  watchFor: z
    .array(z.string())
    .min(2)
    .max(4)
    .describe("Concrete things the incoming volunteer should do or watch for on day one."),
});

export type PodBriefing = z.infer<typeof BriefingSchema>;

export type BriefingSource = "model" | "fallback" | "existing";

export interface GenerateBriefingResult {
  briefing: PodBriefing;
  source: BriefingSource;
  generatedBy: string;
  generatedAt: string;
}

function renderSignals(s: PodLearningSignals): string {
  const lines: string[] = [];
  lines.push(`Pod: ${s.pod.name}`);
  lines.push(`Outgoing volunteer: ${s.pod.volunteerName ?? "(none assigned)"}`);
  lines.push(`Students: ${s.students.map((x) => x.name).join(", ") || "(none)"}`);
  lines.push("");
  lines.push("Where the pod is, per course:");
  for (const c of s.courses) {
    lines.push(
      `- ${c.courseName}: ${
        c.currentNodeTitle
          ? `node ${c.nodePosition} of ${c.totalNodes} - "${c.currentNodeTitle}"`
          : "not started"
      }`,
    );
  }
  if (s.checkpoints.length) {
    lines.push("");
    lines.push("Checkpoint attempts (per student, per node):");
    for (const c of s.checkpoints) {
      lines.push(
        `- ${c.studentName} · ${c.courseName} · "${c.nodeTitle}": ${c.attempts} attempt(s), ${
          c.passed ? "passed" : "not passed"
        }`,
      );
    }
  }
  if (s.assessments.length) {
    lines.push("");
    lines.push("Unit assessment results:");
    for (const a of s.assessments) {
      lines.push(
        `- ${a.studentName} · ${a.courseName} · "${a.unitTitle}": ${Math.round(
          a.score * 100,
        )}%, ${a.passed ? "passed" : "not passed"}`,
      );
    }
  }
  if (s.notes.length) {
    lines.push("");
    lines.push("Session notes (most recent first):");
    for (const n of s.notes) {
      const who = n.authorKind === "system" ? "system" : n.authorName ?? "volunteer";
      lines.push(`- [${who}${n.courseName ? ` · ${n.courseName}` : ""}] ${n.note}`);
    }
  }
  return lines.join("\n");
}

async function generateWithModel(
  s: PodLearningSignals,
): Promise<{ briefing: PodBriefing; usage: TokenUsage | null }> {
  const system =
    "You are briefing a community volunteer who is taking over a homeschool pod from " +
    "someone who just left. Write a short, concrete handoff - how the group has been " +
    "learning, not just where they are. Ground every statement in the data and notes " +
    "provided; do not invent specifics. Warm, plain, practical. No preamble.";
  const user = [
    "Here is everything on record for this pod:",
    "",
    renderSignals(s),
    "",
    "Write the handoff briefing.",
  ].join("\n");

  const response = await getAnthropic().messages.parse({
    model: LESSON_MODEL,
    max_tokens: 3000,
    system,
    messages: [{ role: "user", content: user }],
    output_config: { format: zodOutputFormat(BriefingSchema) },
  });

  const body = response.parsed_output;
  if (!body) {
    throw new Error(
      `pod briefing: unparseable model output (stop_reason=${response.stop_reason})`,
    );
  }
  return { briefing: body, usage: response.usage ?? null };
}

/** A deterministic briefing assembled straight from the signals - no model. */
export function fallbackBriefing(s: PodLearningSignals): PodBriefing {
  const perCourse = s.courses.map((c) => {
    const cps = s.checkpoints.filter((x) => x.courseName === c.courseName);
    const struggling = cps.filter((x) => !x.passed || x.attempts > 1);
    let status: PodBriefing["perCourse"][number]["status"] = "not started";
    if (c.currentNodeTitle) {
      status = struggling.length === 0 ? "moving well" : struggling.length >= 2 ? "stuck" : "some friction";
    }
    return {
      course: c.courseName,
      position: c.currentNodeTitle ? `node ${c.nodePosition} of ${c.totalNodes}` : "not started",
      status,
      note: c.currentNodeTitle
        ? struggling.length
          ? `${struggling.map((x) => x.studentName).join(", ")} needed extra attempts here.`
          : "No checkpoint friction on record."
        : "The pod hasn't opened this course yet.",
    };
  });

  const students = s.students.map((st) => {
    const mine = s.checkpoints.filter((x) => x.studentName === st.name);
    const retries = mine.filter((x) => x.attempts > 1 || !x.passed);
    return {
      name: st.name,
      observation: retries.length
        ? `Extra attempts on: ${retries.map((x) => `"${x.nodeTitle}"`).join(", ")}.`
        : mine.length
          ? "Passing checkpoints on the first try so far."
          : "No checkpoint activity yet.",
    };
  });

  const watchFor: string[] = [];
  const stuckCourses = perCourse.filter((c) => c.status === "stuck" || c.status === "some friction");
  for (const c of stuckCourses) watchFor.push(`Review ${c.course} with the pod - ${c.note}`);
  for (const n of s.notes.slice(0, 2)) watchFor.push(`From notes: ${n.note}`);
  if (watchFor.length < 2) watchFor.push("Check each student's last checkpoint before moving the pod forward.");
  if (watchFor.length < 2) watchFor.push("Ask the pod what the previous session covered.");

  return {
    headline: `${s.pod.name} is ${
      perCourse.every((c) => c.status === "not started")
        ? "just getting started"
        : perCourse.some((c) => c.status === "stuck")
          ? "making progress but stuck in at least one course"
          : "moving steadily through its units"
    }.`,
    perCourse,
    students,
    watchFor: watchFor.slice(0, 4),
  };
}

/**
 * Generate + persist a handoff briefing for a pod. Always writes a new
 * pod_briefings row (a briefing is a point-in-time snapshot). Pass
 * `{ reuseWithinMs }` to return the last briefing if it's still fresh.
 */
export async function generatePodBriefing(
  podId: string,
  masjidId: string,
  opts: { reuseWithinMs?: number; actorUserId?: string | null } = {},
): Promise<GenerateBriefingResult> {
  if (opts.reuseWithinMs && opts.reuseWithinMs > 0) {
    const latest = await getLatestBriefing(podId, masjidId);
    if (latest && Date.now() - new Date(latest.generatedAt).getTime() < opts.reuseWithinMs) {
      return {
        briefing: latest.content,
        source: "existing",
        generatedBy: latest.generatedBy,
        generatedAt: latest.generatedAt,
      };
    }
  }

  const signals = await gatherPodLearningSignals(podId, masjidId);

  let briefing: PodBriefing;
  let source: BriefingSource;
  let generatedBy: string;
  try {
    const res = await generateWithModel(signals);
    briefing = res.briefing;
    source = "model";
    generatedBy = LESSON_MODEL;
    await logModelCall({
      feature: "briefing",
      masjidId,
      actorUserId: opts.actorUserId ?? null,
      model: LESSON_MODEL,
      source: "model",
      usage: res.usage,
    });
  } catch (modelError) {
    console.warn(
      `[lib/ai/continuity] model briefing failed for pod ${podId}; using deterministic fallback.`,
      modelError instanceof Error ? modelError.message : modelError,
    );
    briefing = fallbackBriefing(signals);
    source = "fallback";
    generatedBy = "fallback";
    await logModelCall({
      feature: "briefing",
      masjidId,
      actorUserId: opts.actorUserId ?? null,
      model: LESSON_MODEL,
      source: "fallback",
      ok: false,
    });
  }

  await saveBriefing(podId, masjidId, briefing, generatedBy);
  const generatedAt = new Date().toISOString();
  return { briefing, source, generatedBy, generatedAt };
}
