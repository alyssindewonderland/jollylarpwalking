import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionValue } from "@/lib/auth";
import { ROOM_COOKIE, verifyRoomCookieValue } from "@/lib/room";

const MEMBER_PATHS = ["/home", "/activity", "/weekly", "/quick-log", "/profile", "/dev"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/who") {
    const room = req.cookies.get(ROOM_COOKIE)?.value;
    if (!(await verifyRoomCookieValue(room))) {
      return NextResponse.redirect(new URL("/enter", req.url));
    }
    return NextResponse.next();
  }

  if (MEMBER_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    const session = req.cookies.get(SESSION_COOKIE)?.value;
    if (await verifySessionValue(session)) return NextResponse.next();

    const room = req.cookies.get(ROOM_COOKIE)?.value;
    if (await verifyRoomCookieValue(room)) {
      return NextResponse.redirect(new URL("/who", req.url));
    }
    return NextResponse.redirect(new URL("/enter", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home/:path*",
    "/activity/:path*",
    "/weekly/:path*",
    "/quick-log/:path*",
    "/profile/:path*",
    "/dev/:path*",
    "/who",
  ],
};
