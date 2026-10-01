import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { members } from "@/db/schema";
import { getSessionMemberId } from "@/lib/auth";
import { generateToken, hashToken } from "@/lib/tokens";

export async function POST() {
  const memberId = await getSessionMemberId();
  if (!memberId) return NextResponse.json({ error: "not signed in" }, { status: 401 });

  const token = generateToken();
  await db.update(members).set({ tokenHash: hashToken(token) }).where(eq(members.id, memberId));

  return NextResponse.json({ token });
}
