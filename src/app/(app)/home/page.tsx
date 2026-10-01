import { db } from "@/db";
import { settings as settingsTable } from "@/db/schema";
import { getLeaderboard, getCrownHolder, getAllTimeGroupTotal, type Period } from "@/lib/leaderboard";
import { getSessionMemberId } from "@/lib/auth";
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
  const [crownHolder, settingsRow, groupTotal] = await Promise.all([
    getCrownHolder(),
    db.select().from(settingsTable).then((r) => r[0]),
    getAllTimeGroupTotal(),
  ]);

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
