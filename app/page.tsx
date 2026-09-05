import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

// Root: bounce to the signed-in dashboard, or the login screen. A public
// marketing landing is a separate task (T29).
export default async function Home() {
  const user = await getCurrentUser();
  redirect(user ? `/${user.role}` : "/login");
}
