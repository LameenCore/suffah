import { requireRole } from "@/lib/auth";
import { DashboardChrome } from "@/components/DashboardChrome";
import { NavIcon } from "@/components/ui/NavIcon";
import type { NavItem } from "@/components/Sidebar";
import { countOpenSupport } from "@/lib/db/support-queries";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireRole("admin");

  let openSupport = 0;
  try {
    openSupport = await countOpenSupport(user.masjidId);
  } catch {
    openSupport = 0;
  }

  const nav: NavItem[] = [
    { href: "/admin", label: "Overview", icon: <NavIcon name="gauge" /> },
    { href: "/admin/pods", label: "Pods & assignment", icon: <NavIcon name="grid" /> },
    { href: "/admin/volunteers", label: "Volunteers", icon: <NavIcon name="users" /> },
    { href: "/admin/continuity", label: "Continuity Fingerprint", icon: <NavIcon name="spark" /> },
    { href: "/admin/handoff-demo", label: "Handoff simulation", icon: <NavIcon name="swap" /> },
    { href: "/admin/compliance", label: "Compliance", icon: <NavIcon name="clipboard" /> },
    { href: "/admin/ledger", label: "Waqf ledger", icon: <NavIcon name="coins" /> },
    { href: "/admin/seerah", label: "Seerah studio", icon: <NavIcon name="book" /> },
    {
      href: "/admin/inbox",
      label: "Help requests",
      icon: <NavIcon name="inbox" />,
      badge: openSupport || undefined,
    },
  ];

  return (
    <DashboardChrome user={user} nav={nav} wide>
      {children}
    </DashboardChrome>
  );
}
