import { requireRole } from "@/lib/auth";
import { DashboardChrome } from "@/components/DashboardChrome";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireRole("admin");
  return <DashboardChrome user={user}>{children}</DashboardChrome>;
}
