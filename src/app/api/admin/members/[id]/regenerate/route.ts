import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { members } from "@/db/schema";
import { isAdminSession } from "@/lib/auth";
import { generateToken, hashToken } from "@/lib/tokens";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const token = generateToken();
  const [member] = await db
    .update(members)
    .set({ tokenHash: hashToken(token) })
    .where(eq(members.id, id))
    .returning();

  if (!member) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({ member, token, inviteUrl: `/i/${token}` });
}
