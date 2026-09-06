import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import type { MessageKey, Translator } from "@/lib/i18n";
import { listAuditEntries, type AuditEntry } from "@/lib/audit";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

// Maps the dotted action verbs written by the admin actions to message keys.
const ACTION_KEY: Record<string, MessageKey> = {
  "volunteer.added": "admin.audit.action.volunteerAdded",
  "volunteer.status_changed": "admin.audit.action.volunteerStatusChanged",
  "volunteer.departure": "admin.audit.action.volunteerDeparture",
  "volunteer.reinstated": "admin.audit.action.volunteerReinstated",
  "pod.student_added": "admin.audit.action.podStudentAdded",
  "pod.student_removed": "admin.audit.action.podStudentRemoved",
  "pod.volunteer_set": "admin.audit.action.podVolunteerSet",
  "compliance.snapshot_saved": "admin.audit.action.complianceSnapshotSaved",
  "compliance.report_exported": "admin.audit.action.complianceReportExported",
  "support.resolved": "admin.audit.action.supportResolved",
  "support.reopened": "admin.audit.action.supportReopened",
  "seerah.contribution_added": "admin.audit.action.seerahContributionAdded",
  "seerah.contributions_incorporated": "admin.audit.action.seerahContributionsIncorporated",
  "barakah.note_added": "admin.audit.action.barakahNoteAdded",
  "continuity.briefing_generated": "admin.audit.action.continuityBriefingGenerated",
  "continuity.session_note_added": "admin.audit.action.continuitySessionNoteAdded",
  "attendance.recorded": "admin.audit.action.attendanceRecorded",
  "ai_budget.updated": "admin.audit.action.aiBudgetUpdated",
  "skill_tree.prereq_added": "admin.audit.action.skillTreePrereqAdded",
  "skill_tree.prereq_removed": "admin.audit.action.skillTreePrereqRemoved",
  "question.disabled": "admin.audit.action.questionDisabled",
  "question.enabled": "admin.audit.action.questionEnabled",
  "course.node_added": "admin.audit.action.courseNodeAdded",
  "course.node_renamed": "admin.audit.action.courseNodeRenamed",
  "course.node_reordered": "admin.audit.action.courseNodeReordered",
  "course.node_deleted": "admin.audit.action.courseNodeDeleted",
  "course.node_unit_set": "admin.audit.action.courseNodeUnitSet",
  "course.unit_added": "admin.audit.action.courseUnitAdded",
  "course.lesson_saved": "admin.audit.action.courseLessonSaved",
  "course.lesson_regenerated": "admin.audit.action.courseLessonRegenerated",
  "course.checkpoint_saved": "admin.audit.action.courseCheckpointSaved",
  "course.checkpoint_regenerated": "admin.audit.action.courseCheckpointRegenerated",
  "masjid.default_locale_changed": "admin.audit.action.masjidDefaultLocaleChanged",
};

function label(action: string, t: Translator): string {
  const key = ACTION_KEY[action];
  return key ? t(key) : action;
}

function Row({
  e,
  t,
  intlLocale,
}: {
  e: AuditEntry;
  t: Translator;
  intlLocale: string;
}) {
  const when = new Date(e.at);
  const meta = Object.entries(e.metadata).filter(([k]) => k !== "simulation");
  return (
    <li className="flex flex-col gap-1 border-b border-border py-3 last:border-0 sm:flex-row sm:items-baseline sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm text-ink">
          <span className="font-medium">{e.actorName ?? t("admin.audit.unknownActor")}</span>{" "}
          {e.actorRole ? <span className="text-ink-4">({e.actorRole}) </span> : null}
          <span className="text-ink-2">{label(e.action, t)}</span>
          {e.metadata.simulation ? (
            <Badge tone="mustard" className="ml-2 align-middle">
              {t("admin.audit.simulation")}
            </Badge>
          ) : null}
        </p>
        <p className="mt-0.5 text-xs text-ink-4">
          {e.targetType ? `${e.targetType} ` : ""}
          {e.targetId ? <code className="text-ink-3">{e.targetId}</code> : null}
          {meta.length > 0 ? (
            <span className="ml-2">
              {meta.map(([k, v]) => `${k}=${JSON.stringify(v)}`).join("  ")}
            </span>
          ) : null}
        </p>
      </div>
      <time
        dateTime={e.at}
        className="shrink-0 text-xs tabular-nums text-ink-4"
        title={when.toLocaleString(intlLocale)}
      >
        {when.toLocaleString(intlLocale, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </time>
    </li>
  );
}

export default async function AdminAuditPage() {
  const user = await requireRole("admin");
  const { t, intlLocale } = await getT(user);

  let entries: AuditEntry[] = [];
  let loadError: string | null = null;
  try {
    entries = await listAuditEntries(user.masjidId, 200);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "could not load the audit trail";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("admin.audit.kicker")}
        title={t("admin.audit.title")}
        lede={t("admin.audit.lede")}
        back={{ href: "/admin", label: t("admin.common.back") }}
      />

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          {t("admin.audit.unavailable", { detail: loadError, cmd: "npm run migrate" })}
        </Card>
      ) : entries.length === 0 ? (
        <Card className="p-6 text-center text-sm text-ink-4">
          {t("admin.audit.empty")}
        </Card>
      ) : (
        <Card className="px-5 py-1">
          <ul>
            {entries.map((e) => (
              <Row key={e.id} e={e} t={t} intlLocale={intlLocale} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
