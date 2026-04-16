import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const ROLE_PATHS: Record<string, string> = {
  DRIVER: "/dashboard/driver",
  MECHANIC: "/dashboard/mechanic",
  ADMIN: "/dashboard/admin",
};

export default async function DashboardRoot() {
  const session = await auth();
  if (!session) redirect("/login");
  const role = session.user.role as string;
  redirect(ROLE_PATHS[role] ?? "/dashboard/driver");
}
