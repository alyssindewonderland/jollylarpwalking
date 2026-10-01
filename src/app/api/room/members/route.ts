import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hasRoomAccess } from "@/lib/room";
import { setSessionCookie } from "@/lib/auth";
import { listMembers, createMember } from "@/lib/members";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(24),
  emoji: z.string().trim().min(1).max(8),
});

export async function GET() {
  if (!(await hasRoomAccess())) return NextResponse.json({ error: "no room access" }, { status: 401 });
  const rows = await listMembers();
  return NextResponse.json({
    members: rows.map((m) => ({ id: m.id, name: m.name, emoji: m.emoji, color: m.color })),
  });
}

export async function POST(req: NextRequest) {
  if (!(await hasRoomAccess())) return NextResponse.json({ error: "no room access" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const member = await createMember(parsed.data.name, parsed.data.emoji);
  await setSessionCookie(member.id);

  return NextResponse.json({ ok: true, member });
}
