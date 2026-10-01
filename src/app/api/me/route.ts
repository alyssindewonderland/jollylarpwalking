import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { members } from "@/db/schema";
import { getSessionMemberId } from "@/lib/auth";
import { getMemberById } from "@/lib/members";

export async function GET() {
  const memberId = await getSessionMemberId();
  if (!memberId) return NextResponse.json({ error: "not signed in" }, { status: 401 });

  const member = await getMemberById(memberId);
  if (!member) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({
    id: member.id,
    name: member.name,
    emoji: member.emoji,
    color: member.color,
    source: member.source,
    lastSyncedAt: member.lastSyncedAt,
  });
}

const bodySchema = z.object({
  name: z.string().trim().min(1).max(24).optional(),
  emoji: z.string().trim().min(1).max(8).optional(),
});

export async function PATCH(req: NextRequest) {
  const memberId = await getSessionMemberId();
  if (!memberId) return NextResponse.json({ error: "not signed in" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const [updated] = await db.update(members).set(parsed.data).where(eq(members.id, memberId)).returning();
  return NextResponse.json({ member: updated });
}
