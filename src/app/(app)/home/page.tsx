import Link from "next/link";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { settings as settingsTable, dailySteps } from "@/db/schema";
import {
  getLeaderboard,
  getCrownHolder,
  getAllTimeGroupTotal,
  getStreak,
  type Period,
} from "@/lib/leaderboard";
import { getSessionMemberId } from "@/lib/auth";
import { getMemberById } from "@/lib/members";
import { todayKey } from "@/lib/timezone";
import { Leaderboard, type LeaderboardRowData } from "@/components/Leaderboard";

export const dynamic = "force-dynamic";

async function buildPeriodData(period: Period, crownHolderId: string | null, selfId: string): Promise<LeaderboardRowData[]> {
  const rows = await getLeaderboard(period);
  return rows.map((row) => ({
    memberId: row.member.id,
    name: row.member.name,
    emoji: row.member.emoji,
    color: row.member.color,
    steps: row.steps,
    rank: row.rank,
    gapToLeader: row.gapToLeader,
    isCrownHolder: row.member.id === crownHolderId,
    isSelf: row.member.id === selfId,
  }));
}

export default async function HomePage() {
  const selfId = (await getSessionMemberId())!;
  const [self, crownHolder, settingsRow, groupTotal, [todayRow]] = await Promise.all([
    getMemberById(selfId),
    getCrownHolder(),
    db.select().from(settingsTable).then((r) => r[0]),
    getAllTimeGroupTotal(),
    db
      .select()
      .from(dailySteps)
      .where(and(eq(dailySteps.memberId, selfId), eq(dailySteps.date, todayKey()))),
  ]);

  const dailyGoal = settingsRow?.dailyGoal ?? 8000;
  const hasLoggedToday = Boolean(todayRow);
  const streak = await getStreak(selfId, dailyGoal);

  const [today, week, month] = await Promise.all([
    buildPeriodData("today", crownHolder?.id ?? null, selfId),
    buildPeriodData("week", crownHolder?.id ?? null, selfId),
    buildPeriodData("month", crownHolder?.id ?? null, selfId),
  ]);

  const groupGoalSteps = settingsRow?.groupGoalSteps ?? null;
  const groupGoalName = settingsRow?.groupGoalName ?? null;
  const progressPct = groupGoalSteps ? Math.min(100, Math.round((groupTotal / groupGoalSteps) * 100)) : null;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-sm text-muted">Stride</p>
        <h1 className="font-display text-4xl leading-none mt-1">Leaderboard</h1>
      </header>

      {!hasLoggedToday && self && (
        <Link
          href="/quick-log"
          className="rounded-2xl p-5 flex items-center gap-4 animate-glow-pulse"
          style={{
            background: `linear-gradient(135deg, color-mix(in srgb, ${self.color} 28%, var(--surface)), var(--surface))`,
            border: `1px solid color-mix(in srgb, ${self.color} 45%, var(--border))`,
            ["--member-color" as string]: self.color,
          }}
        >
          <span className="text-3xl">{self.emoji}</span>
          <div className="flex-1">
            <p className="font-medium">Log today&apos;s steps</p>
            <p className="text-xs text-muted mt-0.5">
              {streak > 0 ? `Keep your ${streak}-day streak going 🔥` : "Takes five seconds"}
            </p>
          </div>
          <span className="font-display text-2xl" style={{ color: self.color }}>
            →
          </span>
        </Link>
      )}

      <Leaderboard data={{ today, week, month }} />

      {groupGoalSteps && progressPct !== null && (
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-baseline justify-between mb-2">
            <p className="font-medium">{groupGoalName ?? "Group goal"}</p>
            <p className="text-sm text-muted">{progressPct}%</p>
          </div>
          <div className="h-3 rounded-full bg-background overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {settingsRow?.stakeText && (
            <p className="text-xs text-muted mt-2">Stakes: {settingsRow.stakeText}</p>
          )}
        </div>
      )}
    </div>
  );
}
