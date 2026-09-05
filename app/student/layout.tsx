import { requireRole } from "@/lib/auth";
import { DashboardChrome } from "@/components/DashboardChrome";

export default async function StudentLayout({ children }: LayoutProps<"/student">) {
  const user = await requireRole("student");
  return <DashboardChrome user={user}>{children}</DashboardChrome>;
}
