import { and, eq, gte, lte, inArray } from "drizzle-orm";
import { startOfWeek as weekStart, endOfWeek as weekEnd, format } from "date-fns";
import { db } from "@/db";
import { dailySteps, members, type Member } from "@/db/schema";
import {
  GROUP_TIMEZONE,
  weekRange,
  previousWeekRange,
  monthRange,
  todayKey,
  datesBetween,
} from "@/lib/timezone";

export type Period = "today" | "week" | "month";

export type LeaderboardRow = {
  member: Member;
  steps: number;
  rank: number;
  gapToLeader: number;
  gapToNext: number | null;
};

async function totalsForRange(startKey: string, endKey: string) {
  const rows = await db
    .select()
    .from(dailySteps)
    .where(and(gte(dailySteps.date, startKey), lte(dailySteps.date, endKey)));

  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.memberId, (totals.get(row.memberId) ?? 0) + row.steps);
  }
  return totals;
}

function rangeForPeriod(period: Period, tz: string) {
  if (period === "today") {
    const key = todayKey(tz);
    return { startKey: key, endKey: key };
  }
  if (period === "week") return weekRange(new Date(), tz);
  return monthRange(new Date(), tz);
}

export async function getLeaderboard(
  period: Period,
  tz: string = GROUP_TIMEZONE,
): Promise<LeaderboardRow[]> {
  const { startKey, endKey } = rangeForPeriod(period, tz);
  const [totals, allMembers] = await Promise.all([
    totalsForRange(startKey, endKey),
    db.select().from(members),
  ]);

  const rows = allMembers
    .map((member) => ({ member, steps: totals.get(member.id) ?? 0 }))
    .sort((a, b) => b.steps - a.steps);

  const leaderSteps = rows[0]?.steps ?? 0;
  return rows.map((row, i) => ({
    ...row,
    rank: i + 1,
    gapToLeader: leaderSteps - row.steps,
    gapToNext: i === 0 ? null : rows[i - 1].steps - row.steps,
  }));
}

/** Who wore the crown last week (previous *completed* Mon-Sun week's winner). */
export async function getCrownHolder(tz: string = GROUP_TIMEZONE): Promise<Member | null> {
  const { startKey, endKey } = previousWeekRange(new Date(), tz);
  const totals = await totalsForRange(startKey, endKey);
  if (totals.size === 0) return null;

  let bestId: string | null = null;
  let bestSteps = -1;
  for (const [memberId, steps] of totals) {
    if (steps > bestSteps) {
      bestSteps = steps;
      bestId = memberId;
    }
  }
  if (!bestId) return null;
  const [member] = await db.select().from(members).where(eq(members.id, bestId));
  return member ?? null;
}

/** Consecutive days (ending today or yesterday) where steps >= goal. */
export async function getStreak(
  memberId: string,
  dailyGoal: number,
  tz: string = GROUP_TIMEZONE,
): Promise<number> {
  const rows = await db
    .select({ date: dailySteps.date, steps: dailySteps.steps })
    .from(dailySteps)
    .where(eq(dailySteps.memberId, memberId));

  const byDate = new Map(rows.map((r) => [r.date, r.steps]));
  const today = todayKey(tz);

  const cursor = new Date(`${today}T00:00:00Z`);
  // If today isn't a goal day yet, the streak is still "alive" through yesterday.
  const todayMet = (byDate.get(today) ?? 0) >= dailyGoal;
  if (!todayMet) cursor.setUTCDate(cursor.getUTCDate() - 1);

  let streak = 0;
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    const steps = byDate.get(key) ?? 0;
    if (steps < dailyGoal) break;
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export async function getMemberHistory(memberId: string, days: number) {
  const end = todayKey();
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const startKey = start.toISOString().slice(0, 10);
  const keys = datesBetween(startKey, end);

  const rows = await db
    .select()
    .from(dailySteps)
    .where(
      and(
        eq(dailySteps.memberId, memberId),
        gte(dailySteps.date, startKey),
        lte(dailySteps.date, end),
      ),
    );
  const byDate = new Map(rows.map((r) => [r.date, r.steps]));
  return keys.map((date) => ({ date, steps: byDate.get(date) ?? 0 }));
}

/** How many completed Mon-Sun weeks each member has won outright, for the profile screen. */
export async function getCrownCounts(): Promise<Map<string, number>> {
  const rows = await db.select().from(dailySteps);

  const weekTotals = new Map<string, Map<string, number>>();
  for (const row of rows) {
    const d = new Date(`${row.date}T00:00:00Z`);
    const key = format(weekStart(d, { weekStartsOn: 1 }), "yyyy-MM-dd");
    if (!weekTotals.has(key)) weekTotals.set(key, new Map());
    const m = weekTotals.get(key)!;
    m.set(row.memberId, (m.get(row.memberId) ?? 0) + row.steps);
  }

  const today = todayKey();
  const counts = new Map<string, number>();
  for (const [weekKey, totals] of weekTotals) {
    const endKey = format(weekEnd(new Date(`${weekKey}T00:00:00Z`), { weekStartsOn: 1 }), "yyyy-MM-dd");
    if (endKey >= today) continue; // only completed weeks count
    let bestId: string | null = null;
    let bestSteps = -1;
    for (const [id, steps] of totals) {
      if (steps > bestSteps) {
        bestSteps = steps;
        bestId = id;
      }
    }
    if (bestId) counts.set(bestId, (counts.get(bestId) ?? 0) + 1);
  }
  return counts;
}

/** Sum of every step ever logged by the group — for the all-time group goal progress bar. */
export async function getAllTimeGroupTotal(): Promise<number> {
  const rows = await db.select({ steps: dailySteps.steps }).from(dailySteps);
  return rows.reduce((sum, r) => sum + r.steps, 0);
}

export async function totalsByMemberIds(memberIds: string[], startKey: string, endKey: string) {
  if (memberIds.length === 0) return new Map<string, number>();
  const rows = await db
    .select()
    .from(dailySteps)
    .where(
      and(
        inArray(dailySteps.memberId, memberIds),
        gte(dailySteps.date, startKey),
        lte(dailySteps.date, endKey),
      ),
    );
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.memberId, (totals.get(row.memberId) ?? 0) + row.steps);
  }
  return totals;
}
