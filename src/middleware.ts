import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, ADMIN_COOKIE, verifySessionValue } from "@/lib/auth";

const MEMBER_PATHS = ["/home", "/activity", "/profile", "/quick-log", "/settings", "/weekly", "/onboarding"];
const ADMIN_PATHS = ["/admin", "/dev"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    if (pathname === "/admin") return NextResponse.next();
    const adminCookie = req.cookies.get(ADMIN_COOKIE)?.value;
    if (!adminCookie || adminCookie !== process.env.ADMIN_SECRET) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  if (MEMBER_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    const session = req.cookies.get(SESSION_COOKIE)?.value;
    if (!(await verifySessionValue(session))) {
      return NextResponse.redirect(new URL("/pair", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home/:path*",
    "/activity/:path*",
    "/profile/:path*",
    "/quick-log/:path*",
    "/settings/:path*",
    "/weekly/:path*",
    "/onboarding/:path*",
    "/admin/:path*",
    "/dev/:path*",
  ],
};
