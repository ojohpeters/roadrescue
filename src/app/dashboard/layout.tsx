import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import { Wrench, Car, Shield, LogOut, LayoutDashboard } from "lucide-react";
import SessionProvider from "@/components/ui/SessionProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const role = session.user.role;

  const navLinks = {
    DRIVER: [
      { href: "/dashboard/driver", label: "My Requests", icon: Car },
    ],
    MECHANIC: [
      { href: "/dashboard/mechanic", label: "Jobs", icon: Wrench },
    ],
    ADMIN: [
      { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
    ],
  }[role] ?? [];

  const roleColor = role === "ADMIN" ? "text-purple-400" : role === "MECHANIC" ? "text-blue-400" : "text-orange-400";
  const roleBg = role === "ADMIN" ? "bg-purple-500/10" : role === "MECHANIC" ? "bg-blue-500/10" : "bg-orange-500/10";

  return (
    <SessionProvider>
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
        {/* Top nav */}
        <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 glass border-b border-white/5">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
                <Wrench className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-sm">Road Rescue</span>
            </Link>
            <div className="hidden sm:flex items-center gap-1 h-5 w-px bg-white/10" />
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 text-sm text-white/60 hover:text-white transition-colors"
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Role badge */}
            <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleColor} ${roleBg}`}>
              {role === "ADMIN" ? <Shield className="w-3 h-3" /> : role === "MECHANIC" ? <Wrench className="w-3 h-3" /> : <Car className="w-3 h-3" />}
              {role}
            </span>

            {/* User avatar */}
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg">
              <div className="w-7 h-7 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-xs font-bold">
                {(session.user.name ?? session.user.email ?? "U")[0].toUpperCase()}
              </div>
              <span className="hidden sm:block text-sm text-white/70 max-w-[100px] truncate">
                {session.user.name ?? session.user.email}
              </span>
            </div>

            {/* Sign out */}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-white/50 hover:text-white transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:block">Sign out</span>
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </SessionProvider>
  );
}
