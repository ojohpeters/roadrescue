import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type Role = "DRIVER" | "MECHANIC" | "ADMIN";

const ROLE_PATHS: Record<Role, string> = {
  DRIVER: "/dashboard/driver",
  MECHANIC: "/dashboard/mechanic",
  ADMIN: "/dashboard/admin",
};

function roleToPath(role: string | undefined): string {
  if (role && role in ROLE_PATHS) return ROLE_PATHS[role as Role];
  return "/dashboard/driver";
}

function isPremiumMechanic(role: string | undefined, pathname: string): boolean {
  if (pathname.startsWith("/dashboard/premium-mechanic")) {
    return role === "MECHANIC" || role === "ADMIN";
  }
  return true;
}

export async function proxy(req: NextRequest) {
  const session = await auth();
  const { pathname } = req.nextUrl;

  // Protect all dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role = session.user?.role as string | undefined;

    // Enforce role-based access
    if (
      pathname.startsWith("/dashboard/driver") &&
      role !== "DRIVER" &&
      role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL(roleToPath(role), req.url));
    }
    if (
      pathname.startsWith("/dashboard/mechanic") &&
      role !== "MECHANIC" &&
      role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL(roleToPath(role), req.url));
    }
    if (
      pathname.startsWith("/dashboard/premium-mechanic") &&
      role !== "MECHANIC" &&
      role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL(roleToPath(role), req.url));
    }
    if (pathname.startsWith("/dashboard/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL(roleToPath(role), req.url));
    }
  }

  // Redirect already-authenticated users away from auth pages
  if ((pathname === "/login" || pathname === "/register") && session) {
    return NextResponse.redirect(
      new URL(roleToPath(session.user?.role as string), req.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
