import { requireRole } from "@/lib/auth";
import { DashboardChrome } from "@/components/DashboardChrome";
import { NavIcon } from "@/components/ui/NavIcon";
import type { NavItem } from "@/components/Sidebar";
import { getT } from "@/lib/i18n";
import { getVolunteerContext } from "@/lib/db/volunteer-portal-queries";
import { VolunteerGate } from "@/components/volunteer/VolunteerGate";

export default async function VolunteerLayout({ children }: LayoutProps<"/volunteer">) {
  const user = await requireRole("volunteer");
  const { locale, t } = await getT(user);

  // Gate: the account must be linked to an active `volunteers` record by an admin.
  // A lookup error shouldn't lock out a linked volunteer — treat only a definite
  // "no linked record" as blocked, and let the page surface any real error.
  let blocked = false;
  try {
    blocked = (await getVolunteerContext(user.id, user.masjidId)) === null;
  } catch {
    blocked = false;
  }
  if (blocked) {
    return (
      <VolunteerGate
        volunteerName={user.name}
        title={t("volunteer.gateTitle")}
        body={t("volunteer.gateBody")}
        hint={t("volunteer.gateHint")}
      />
    );
  }

  const nav: NavItem[] = [
    { href: "/volunteer", label: t("volunteer.navMyPods"), icon: <NavIcon name="grid" /> },
    { href: "/volunteer/board", label: t("nav.podBoard"), icon: <NavIcon name="inbox" /> },
  ];

  return (
    <DashboardChrome user={user} nav={nav} locale={locale}>
      {children}
    </DashboardChrome>
  );
}
