import { NextRequest, NextResponse } from "next/server";
import { getMemberByToken } from "@/lib/members";
import { setSessionCookie } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const member = await getMemberByToken(token);
  if (!member) {
    return NextResponse.redirect(new URL("/?invalid=1", req.url));
  }

  await setSessionCookie(member.id);
  return NextResponse.redirect(new URL("/onboarding/add-to-home-screen", req.url));
}
