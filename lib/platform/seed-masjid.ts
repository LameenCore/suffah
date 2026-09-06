// Starter curriculum skeleton for a freshly-provisioned masjid (T33).
//
// Mirrors the course/unit/pathway-node shape seeded for the demo masjid
// (scripts/seed.ts) — the same three courses, one unit each, three nodes each,
// grade band "Secondary 1". No lesson_content: that is generated on demand by
// lib/ai/lesson.ts the first time a student reaches a node.

import { getServiceClient } from "@/lib/db";

const SKELETON: {
  name: "Math" | "Seerah" | "AI Literacy";
  unit: string;
  nodes: string[];
}[] = [
  {
    name: "Math",
    unit: "Operations with Integers",
    nodes: [
      "Adding and subtracting integers",
      "Multiplying and dividing integers",
      "Order of operations with integers",
    ],
  },
  {
    name: "Seerah",
    unit: "The Meccan Period",
    nodes: [
      "Mecca before the revelation",
      "The first revelation",
      "The early community and its trials",
    ],
  },
  {
    name: "AI Literacy",
    unit: "What a Model Actually Does",
    nodes: [
      "Prediction, not knowledge",
      "Training data and where it comes from",
      "Why models get things confidently wrong",
    ],
  },
];

export async function seedCurriculumSkeleton(masjidId: string): Promise<void> {
  const db = getServiceClient();

  for (const c of SKELETON) {
    const { data: course, error: cErr } = await db
      .from("courses")
      .insert({ masjid_id: masjidId, name: c.name, grade_band: "Secondary 1" })
      .select("id")
      .single();
    if (cErr || !course) throw new Error(`seed course ${c.name}: ${cErr?.message}`);

    const { data: unit, error: uErr } = await db
      .from("units")
      .insert({ course_id: course.id, title: c.unit, sequence_order: 1 })
      .select("id")
      .single();
    if (uErr || !unit) throw new Error(`seed unit ${c.unit}: ${uErr?.message}`);

    const nodeRows = c.nodes.map((title, i) => ({
      course_id: course.id,
      unit_id: unit.id,
      sequence_order: i + 1,
      title,
    }));
    const { error: nErr } = await db.from("pathway_nodes").insert(nodeRows);
    if (nErr) throw new Error(`seed nodes ${c.name}: ${nErr.message}`);
  }
}
