import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { members } from "@/db/schema";
import { isAdminSession } from "@/lib/auth";
import { generateToken, hashToken } from "@/lib/tokens";
import { ensureNotificationPrefs } from "@/lib/members";

const bodySchema = z.object({
  name: z.string().min(1).max(40),
  emoji: z.string().min(1).max(8),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  source: z.enum(["shortcut", "manual"]),
  isAdmin: z.boolean().optional(),
});

export async function GET() {
  if (!(await isAdminSession())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const rows = await db.select().from(members).orderBy(desc(members.createdAt));
  return NextResponse.json({ members: rows });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const token = generateToken();
  const [member] = await db
    .insert(members)
    .values({ ...parsed.data, tokenHash: hashToken(token) })
    .returning();

  await ensureNotificationPrefs(member.id);

  return NextResponse.json({
    member,
    token,
    inviteUrl: `/i/${token}`,
  });
}
