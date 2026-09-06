import { requireRole } from "@/lib/auth";
import { listAuditEntries, type AuditEntry } from "@/lib/audit";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

// Human-readable labels for the dotted action verbs written by the admin actions.
const ACTION_LABEL: Record<string, string> = {
  "volunteer.added": "Added a volunteer",
  "volunteer.status_changed": "Changed a volunteer's status",
  "volunteer.departure": "Recorded a volunteer departure",
  "volunteer.reinstated": "Reinstated a volunteer",
  "pod.student_added": "Added a student to a pod",
  "pod.student_removed": "Removed a student from a pod",
  "pod.volunteer_set": "Set a pod's volunteer",
  "compliance.snapshot_saved": "Saved a compliance snapshot",
  "compliance.report_exported": "Marked a compliance report exported",
  "support.resolved": "Resolved a help request",
  "support.reopened": "Reopened a help request",
  "seerah.contribution_added": "Added a Seerah contribution",
  "seerah.contributions_incorporated": "Incorporated Seerah contributions",
  "barakah.note_added": "Recorded a barakah note",
  "continuity.briefing_generated": "Generated a handoff briefing",
  "continuity.session_note_added": "Added a pod session note",
  "ai_budget.updated": "Updated the AI budget",
  "skill_tree.prereq_added": "Added a prerequisite edge",
  "skill_tree.prereq_removed": "Removed a prerequisite edge",
  "question.disabled": "Disabled a checkpoint question",
  "question.enabled": "Re-enabled a checkpoint question",
  "course.node_added": "Added a pathway node",
  "course.node_renamed": "Renamed a pathway node",
  "course.node_reordered": "Reordered a pathway node",
  "course.node_deleted": "Deleted a pathway node",
  "course.node_unit_set": "Changed a node's unit",
  "course.unit_added": "Added a unit",
  "course.lesson_saved": "Hand-edited a node's lesson",
  "course.lesson_regenerated": "Regenerated a node's lesson",
  "course.checkpoint_saved": "Hand-edited a node's checkpoint",
  "course.checkpoint_regenerated": "Regenerated a node's checkpoint",
};

function label(action: string): string {
  return ACTION_LABEL[action] ?? action;
}

function Row({ e }: { e: AuditEntry }) {
  const when = new Date(e.at);
  const meta = Object.entries(e.metadata).filter(([k]) => k !== "simulation");
  return (
    <li className="flex flex-col gap-1 border-b border-border py-3 last:border-0 sm:flex-row sm:items-baseline sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm text-ink">
          <span className="font-medium">{e.actorName ?? "Unknown"}</span>{" "}
          {e.actorRole ? <span className="text-ink-4">({e.actorRole}) </span> : null}
          <span className="text-ink-2">{label(e.action)}</span>
          {e.metadata.simulation ? (
            <Badge tone="mustard" className="ml-2 align-middle">
              simulation
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
        title={when.toLocaleString()}
      >
        {when.toLocaleString("en-CA", {
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
        kicker="Audit trail"
        title="Who changed what"
        lede="An append-only record of sensitive actions - pod assignments, volunteer changes, compliance snapshots and exports. Ids and action names only, no personal notes."
        back={{ href: "/admin", label: "Overview" }}
      />

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          {loadError}. Run <code>npm run migrate</code>.
        </Card>
      ) : entries.length === 0 ? (
        <Card className="p-6 text-center text-sm text-ink-4">
          No entries yet. Sensitive admin actions will show up here.
        </Card>
      ) : (
        <Card className="px-5 py-1">
          <ul>
            {entries.map((e) => (
              <Row key={e.id} e={e} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
