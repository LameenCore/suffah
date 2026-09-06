import { requireRole } from "@/lib/auth";
import { listSkillGraph } from "@/lib/db/skill-tree-queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { SkillTreeEditor } from "@/components/admin/SkillTreeEditor";

export default async function SkillTreePage() {
  const user = await requireRole("admin");

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
        kicker="Skill tree"
        title="Prerequisites & concepts"
        lede="Which nodes a student must pass before another opens. Edges can cross courses. A student sees a locked node with the reason; the pod still moves through its own course in order."
        back={{ href: "/admin", label: "Overview" }}
      />

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          {loadError}. Run <code>npm run migrate</code>.
        </Card>
      ) : graph && graph.nodes.length > 0 ? (
        <>
          <p className="text-xs text-ink-4">
            {graph.nodes.length} nodes · {edgeCount} prerequisite edge{edgeCount === 1 ? "" : "s"}
          </p>
          <SkillTreeEditor nodes={graph.nodes} />
        </>
      ) : (
        <Card className="p-6 text-sm text-ink-4">No pathway nodes yet.</Card>
      )}
    </div>
  );
}
