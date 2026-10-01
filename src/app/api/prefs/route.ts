import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notificationPrefs } from "@/db/schema";
import { getSessionMemberId } from "@/lib/auth";
import { ensureNotificationPrefs } from "@/lib/members";

const bodySchema = z.object({
  overtakes: z.boolean().optional(),
  closeRace: z.boolean().optional(),
  weekly: z.boolean().optional(),
  reminders: z.boolean().optional(),
  reactions: z.boolean().optional(),
});

export async function GET() {
  const memberId = await getSessionMemberId();
  if (!memberId) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const prefs = await ensureNotificationPrefs(memberId);
  return NextResponse.json({ prefs });
}

export async function PATCH(req: NextRequest) {
  const memberId = await getSessionMemberId();
  if (!memberId) return NextResponse.json({ error: "not signed in" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  await ensureNotificationPrefs(memberId);
  const [updated] = await db
    .update(notificationPrefs)
    .set(parsed.data)
    .where(eq(notificationPrefs.memberId, memberId))
    .returning();

  return NextResponse.json({ prefs: updated });
}
