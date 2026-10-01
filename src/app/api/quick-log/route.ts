import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { dailySteps, members, settings } from "@/db/schema";
import { getSessionMemberId } from "@/lib/auth";
import { todayKey, yesterdayKey } from "@/lib/timezone";
import { evaluateAfterUpdate } from "@/lib/notifications/engine";
import { getStreak } from "@/lib/leaderboard";

const bodySchema = z.object({
  steps: z.number().int().min(0).max(100_000),
  day: z.enum(["today", "yesterday"]).default("today"),
});

export async function POST(req: NextRequest) {
  const memberId = await getSessionMemberId();
  if (!memberId) {
    return NextResponse.json({ error: "not signed in" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const date = parsed.data.day === "today" ? todayKey() : yesterdayKey();

  const [[existing], historyRows, [groupSettings]] = await Promise.all([
    db
      .select()
      .from(dailySteps)
      .where(and(eq(dailySteps.memberId, memberId), eq(dailySteps.date, date))),
    db.select({ steps: dailySteps.steps, date: dailySteps.date }).from(dailySteps).where(eq(dailySteps.memberId, memberId)),
    db.select().from(settings),
  ]);

  const beforeSteps = existing?.steps ?? 0;
  const previousBest = Math.max(0, ...historyRows.filter((r) => r.date !== date).map((r) => r.steps));
  const dailyGoal = groupSettings?.dailyGoal ?? 8000;

  await db
    .insert(dailySteps)
    .values({ memberId, date, steps: parsed.data.steps, source: "manual" })
    .onConflictDoUpdate({
      target: [dailySteps.memberId, dailySteps.date],
      set: { steps: parsed.data.steps, source: "manual", updatedAt: new Date() },
    });

  await db.update(members).set({ lastSyncedAt: new Date() }).where(eq(members.id, memberId));

  let newStreak = 0;
  if (date === todayKey()) {
    await evaluateAfterUpdate(memberId, beforeSteps, parsed.data.steps);
    newStreak = await getStreak(memberId, dailyGoal);
  }

  return NextResponse.json({
    ok: true,
    metGoal: parsed.data.steps >= dailyGoal,
    isPersonalBest: parsed.data.steps > previousBest && parsed.data.steps > 0,
    streak: newStreak,
    dailyGoal,
  });
}
