import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { listQuestionBank } from "@/lib/db/question-bank-queries";
import { isProblemFlag } from "@/lib/analytics/item-analytics";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { RegulationNote } from "@/components/RegulationNote";
import { QuestionBank } from "@/components/admin/QuestionBank";

export default async function QuestionBankPage() {
  const user = await requireRole("admin");
  const { t } = await getT(user);

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
        kicker={t("admin.questionBank.kicker")}
        title={t("admin.questionBank.title")}
        lede={t("admin.questionBank.lede")}
        back={{ href: "/admin", label: t("admin.common.back") }}
      />

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          {t("admin.questionBank.unavailable", { detail: loadError, cmd: "npm run migrate" })}
        </Card>
      ) : total === 0 ? (
        <Card className="p-6 text-sm text-ink-4">{t("admin.questionBank.empty")}</Card>
      ) : (
        <>
          <p className="text-xs text-ink-4">
            {t("admin.questionBank.summary", { total, flagged, disabled })}
          </p>
          <RegulationNote>{t("admin.questionBank.regulationNote")}</RegulationNote>
          <QuestionBank courses={courses} />
        </>
      )}
    </div>
  );
}
