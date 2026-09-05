import { requireRole } from "@/lib/auth";
import { DashboardChrome } from "@/components/DashboardChrome";

export default async function ParentLayout({ children }: LayoutProps<"/parent">) {
  const user = await requireRole("parent");
  return <DashboardChrome user={user}>{children}</DashboardChrome>;
}
