import { requireRole } from "@/lib/auth";
import { DashboardChrome } from "@/components/DashboardChrome";
import { NavIcon } from "@/components/ui/NavIcon";
import type { NavItem } from "@/components/Sidebar";
import { getStudentTracks } from "@/lib/db/queries";

export default async function StudentLayout({ children }: LayoutProps<"/student">) {
  const user = await requireRole("student");

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
