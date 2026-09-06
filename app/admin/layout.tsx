import { requireRole } from "@/lib/auth";
import { DashboardChrome } from "@/components/DashboardChrome";
import { NavIcon } from "@/components/ui/NavIcon";
import type { NavItem } from "@/components/Sidebar";
import { countOpenSupport } from "@/lib/db/support-queries";
import { getT } from "@/lib/i18n";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireRole("admin");
  const { locale, t } = await getT(user);

  let openSupport = 0;
  try {
    openSupport = await countOpenSupport(user.masjidId);
  } catch {
    openSupport = 0;
  }

  const nav: NavItem[] = [
    { href: "/admin", label: t("nav.overview"), icon: <NavIcon name="gauge" /> },
    { href: "/admin/analytics", label: t("nav.analytics"), icon: <NavIcon name="chart" /> },
    { href: "/admin/pods", label: t("nav.pods"), icon: <NavIcon name="grid" /> },
    { href: "/admin/volunteers", label: t("nav.volunteers"), icon: <NavIcon name="users" /> },
    { href: "/admin/continuity", label: t("nav.continuity"), icon: <NavIcon name="spark" /> },
    { href: "/admin/handoff-demo", label: t("nav.handoff"), icon: <NavIcon name="swap" /> },
    { href: "/admin/compliance", label: t("nav.compliance"), icon: <NavIcon name="clipboard" /> },
    { href: "/admin/ledger", label: t("nav.ledger"), icon: <NavIcon name="coins" /> },
    { href: "/admin/ai-spend", label: t("nav.aiSpend"), icon: <NavIcon name="gauge" /> },
    { href: "/admin/seerah", label: t("nav.seerah"), icon: <NavIcon name="book" /> },
    { href: "/admin/audit", label: t("nav.audit"), icon: <NavIcon name="shield" /> },
    {
      href: "/admin/inbox",
      label: t("nav.helpRequests"),
      icon: <NavIcon name="inbox" />,
      badge: openSupport || undefined,
    },
  ];

  return (
    <DashboardChrome user={user} nav={nav} locale={locale} wide>
      {children}
    </DashboardChrome>
  );
}
