import { requireRole } from "@/lib/auth";
import { DashboardChrome } from "@/components/DashboardChrome";
import { NavIcon } from "@/components/ui/NavIcon";
import type { NavItem } from "@/components/Sidebar";
import { getStudentTracks } from "@/lib/db/queries";
import { hasActiveConsent } from "@/lib/consent";
import { ConsentGate } from "@/components/student/ConsentGate";

export default async function StudentLayout({ children }: LayoutProps<"/student">) {
  const user = await requireRole("student");

  // Law 25 (T37): no playground until a guardian consent record is on file.
  // Fail closed only on a definite "no consent" — a lookup error shouldn't lock
  // a consented student out, so treat an error as "let them through" and let the
  // pages themselves surface any real problem.
  let consentBlocked = false;
  try {
    consentBlocked = !(await hasActiveConsent(user.id, user.masjidId));
  } catch {
    consentBlocked = false;
  }
  if (consentBlocked) return <ConsentGate studentName={user.name} />;

  let courses: { id: string; name: string }[] = [];
  try {
    const { tracks } = await getStudentTracks(user.id, user.masjidId);
    courses = tracks.map((t) => ({ id: t.course.id, name: t.course.name }));
  } catch {
    // sidebar still works with just "My courses"
  }

  const nav: NavItem[] = [
    { href: "/student", label: "My courses", icon: <NavIcon name="path" /> },
    ...courses.map((c) => ({
      href: `/student/${c.id}`,
      label: c.name,
      icon: <NavIcon name="book" />,
    })),
  ];

  return <DashboardChrome user={user} nav={nav}>{children}</DashboardChrome>;
}
