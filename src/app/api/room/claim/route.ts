import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hasRoomAccess } from "@/lib/room";
import { setSessionCookie } from "@/lib/auth";
import { getMemberById } from "@/lib/members";

const bodySchema = z.object({ memberId: z.string().uuid() });

// "I'm already one of these people" — e.g. reopening on a newly-installed home-screen
// icon, which has separate storage from Safari and so starts with no session.
export async function POST(req: NextRequest) {
  if (!(await hasRoomAccess())) return NextResponse.json({ error: "no room access" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const member = await getMemberById(parsed.data.memberId);
  if (!member) return NextResponse.json({ error: "not found" }, { status: 404 });

  await setSessionCookie(member.id);
  return NextResponse.json({ ok: true });
}
