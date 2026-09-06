import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { listSkillGraph } from "@/lib/db/skill-tree-queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { SkillTreeEditor } from "@/components/admin/SkillTreeEditor";

export default async function SkillTreePage() {
  const user = await requireRole("admin");
  const { t } = await getT(user);

  let graph: Awaited<ReturnType<typeof listSkillGraph>> | null = null;
  let loadError: string | null = null;
  try {
    graph = await listSkillGraph(user.masjidId);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "could not load the skill graph";
  }

  const edgeCount = graph?.nodes.reduce((s, n) => s + n.prereqs.length, 0) ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("admin.skillTree.kicker")}
        title={t("admin.skillTree.title")}
        lede={t("admin.skillTree.lede")}
        back={{ href: "/admin", label: t("admin.common.back") }}
      />

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          {t("admin.skillTree.unavailable", { detail: loadError, cmd: "npm run migrate" })}
        </Card>
      ) : graph && graph.nodes.length > 0 ? (
        <>
          <p className="text-xs text-ink-4">
            {t(edgeCount === 1 ? "admin.skillTree.countOne" : "admin.skillTree.countMany", {
              nodes: graph.nodes.length,
              edges: edgeCount,
            })}
          </p>
          <SkillTreeEditor nodes={graph.nodes} />
        </>
      ) : (
        <Card className="p-6 text-sm text-ink-4">{t("admin.skillTree.empty")}</Card>
      )}
    </div>
  );
}
