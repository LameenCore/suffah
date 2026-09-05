import { requireRole } from "@/lib/auth";
import { DashboardChrome } from "@/components/DashboardChrome";
import type { NavItem } from "@/components/SubNav";

const NAV: NavItem[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/pods", label: "Pods" },
  { href: "/admin/volunteers", label: "Volunteers" },
  { href: "/admin/continuity", label: "Continuity" },
  { href: "/admin/compliance", label: "Compliance" },
  { href: "/admin/ledger", label: "Waqf ledger" },
  { href: "/admin/seerah", label: "Seerah studio" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireRole("admin");
  return (
    <DashboardChrome user={user} nav={NAV} wide>
      {children}
    </DashboardChrome>
  );
}
