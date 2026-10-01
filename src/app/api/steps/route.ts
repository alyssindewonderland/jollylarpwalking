import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { dailySteps, members } from "@/db/schema";
import { getMemberByToken } from "@/lib/members";
import { todayKey, isFutureDateKey } from "@/lib/timezone";
import { evaluateAfterUpdate } from "@/lib/notifications/engine";
import { shouldSkipIngest } from "@/lib/notifications/rules";
import { ingestBodySchema } from "@/lib/ingest-schema";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "missing bearer token" }, { status: 401 });
  }

  const member = await getMemberByToken(token);
  if (!member) {
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }

  // Called many times a day by the Shortcut; silently no-op rapid repeats.
  if (shouldSkipIngest(member.lastIngestAt)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const parsed = ingestBodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const today = todayKey();
  let beforeToday = 0;
  let afterToday: number | null = null;

  for (const day of parsed.data.days) {
    if (isFutureDateKey(day.date)) continue;

    if (day.date === today) {
      const [existing] = await db
        .select()
        .from(dailySteps)
        .where(and(eq(dailySteps.memberId, member.id), eq(dailySteps.date, day.date)));
      beforeToday = existing?.steps ?? 0;
    }

    await db
      .insert(dailySteps)
      .values({ memberId: member.id, date: day.date, steps: day.steps, source: member.source })
      .onConflictDoUpdate({
        target: [dailySteps.memberId, dailySteps.date],
        set: { steps: day.steps, source: member.source, updatedAt: new Date() },
      });

    if (day.date === today) afterToday = day.steps;
  }

  await db
    .update(members)
    .set({ lastSyncedAt: new Date(), lastIngestAt: new Date() })
    .where(eq(members.id, member.id));

  if (afterToday !== null) {
    await evaluateAfterUpdate(member.id, beforeToday, afterToday);
  }

  return NextResponse.json({ ok: true });
}
