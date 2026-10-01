import { NextResponse } from "next/server";
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
