import { requireRole } from "@/lib/auth";
import { DashboardChrome } from "@/components/DashboardChrome";
import type { NavItem } from "@/components/SubNav";

const NAV: NavItem[] = [
  { href: "/parent", label: "This week" },
  { href: "/parent/compliance", label: "Evaluation status" },
];

export default async function ParentLayout({ children }: LayoutProps<"/parent">) {
  const user = await requireRole("parent");
  return (
    <DashboardChrome user={user} nav={NAV}>
      {children}
    </DashboardChrome>
  );
}
