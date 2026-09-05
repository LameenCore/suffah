import { requireRole } from "@/lib/auth";
import { DashboardChrome } from "@/components/DashboardChrome";
import { NavIcon } from "@/components/ui/NavIcon";
import type { NavItem } from "@/components/Sidebar";

const NAV: NavItem[] = [
  { href: "/parent", label: "This week", icon: <NavIcon name="home" /> },
  { href: "/parent/compliance", label: "Evaluation status", icon: <NavIcon name="clipboard" /> },
];

export default async function ParentLayout({ children }: LayoutProps<"/parent">) {
  const user = await requireRole("parent");
  return (
    <DashboardChrome user={user} nav={NAV}>
      {children}
    </DashboardChrome>
  );
}
