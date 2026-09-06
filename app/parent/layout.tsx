import { requireRole } from "@/lib/auth";
import { DashboardChrome } from "@/components/DashboardChrome";
import { NavIcon } from "@/components/ui/NavIcon";
import type { NavItem } from "@/components/Sidebar";
import { getT } from "@/lib/i18n";

export default async function ParentLayout({ children }: LayoutProps<"/parent">) {
  const user = await requireRole("parent");
  const { locale, t } = await getT(user);

  const nav: NavItem[] = [
    { href: "/parent", label: t("nav.thisWeek"), icon: <NavIcon name="home" /> },
    { href: "/parent/compliance", label: t("nav.evaluationStatus"), icon: <NavIcon name="clipboard" /> },
    { href: "/parent/consent", label: t("nav.consent"), icon: <NavIcon name="check" /> },
    { href: "/parent/privacy", label: t("nav.yourData"), icon: <NavIcon name="shield" /> },
  ];

  return (
    <DashboardChrome user={user} nav={nav} locale={locale}>
      {children}
    </DashboardChrome>
  );
}
