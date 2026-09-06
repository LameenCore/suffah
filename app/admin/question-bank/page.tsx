import { requireRole } from "@/lib/auth";
import { listQuestionBank } from "@/lib/db/question-bank-queries";
import { isProblemFlag } from "@/lib/analytics/item-analytics";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { RegulationNote } from "@/components/RegulationNote";
import { QuestionBank } from "@/components/admin/QuestionBank";

export default async function QuestionBankPage() {
  const user = await requireRole("admin");

  let courses: Awaited<ReturnType<typeof listQuestionBank>> = [];
  let loadError: string | null = null;
  try {
    courses = await listQuestionBank(user.masjidId);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "could not load the question bank";
  }

  const total = courses.reduce((s, c) => s + c.questions.length, 0);
  const flagged = courses.reduce(
    (s, c) => s + c.questions.filter((q) => q.stats && isProblemFlag(q.stats.flag)).length,
    0,
  );
  const disabled = courses.reduce((s, c) => s + c.questions.filter((q) => q.disabled).length, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Question bank"
        title="Checkpoint items & how they perform"
        lede="Every checkpoint question, with its difficulty (p-value: fraction correct) and discrimination (how well it separates stronger and weaker students) from real attempts. Disable a weak or miskeyed item - grading and the student view skip it immediately."
        back={{ href: "/admin", label: "Overview" }}
      />

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          {loadError}. Run <code>npm run migrate</code>.
        </Card>
      ) : total === 0 ? (
        <Card className="p-6 text-sm text-ink-4">
          No checkpoint questions yet - generate the checkpoints first.
        </Card>
      ) : (
        <>
          <p className="text-xs text-ink-4">
            {total} items · {flagged} flagged · {disabled} disabled
          </p>
          <RegulationNote>
            Item statistics are a quality signal, not a grading rule. A low p-value can
            mean a hard-but-fair question; review before disabling.
          </RegulationNote>
          <QuestionBank courses={courses} />
        </>
      )}
    </div>
  );
}
