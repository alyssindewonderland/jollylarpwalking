import { notFound } from "next/navigation";
import { db } from "@/db";
import { settings as settingsTable } from "@/db/schema";
import { getSessionMemberId } from "@/lib/auth";
import { getMemberById } from "@/lib/members";
import { getMemberHistory, getAllMemberSteps, getStreak, longestStreak, getCrownCounts } from "@/lib/leaderboard";
import { computeBadges } from "@/lib/badges";
import { listMilestones, getMemberStepsWithTimestamps, isMilestoneEarned } from "@/lib/milestones";
import { MemberAvatar } from "@/components/MemberAvatar";
import { StepsChart } from "@/components/StepsChart";
import { BadgeRow } from "@/components/BadgeRow";
import { MilestoneBadgeRow } from "@/components/MilestoneBadgeRow";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: memberId } = await params;
  const selfId = await getSessionMemberId();
  const member = await getMemberById(memberId);
  if (!member) notFound();

  const [settingsRow] = await db.select().from(settingsTable);
  const dailyGoal = settingsRow?.dailyGoal ?? 8000;

  const [chartHistory, allHistory, currentStreak, crownCounts, milestoneDefs, timedHistory] = await Promise.all([
    getMemberHistory(memberId, 30),
    getAllMemberSteps(memberId),
    getStreak(memberId, dailyGoal),
    getCrownCounts(),
    listMilestones(),
    getMemberStepsWithTimestamps(memberId),
  ]);

  const crowns = crownCounts.get(memberId) ?? 0;
  const loggedDays = allHistory.filter((h) => h.steps > 0);
  const best = loggedDays.reduce((a, b) => (b.steps > a.steps ? b : a), loggedDays[0] ?? { date: "", steps: 0 });
  const average = loggedDays.length
    ? Math.round(loggedDays.reduce((sum, d) => sum + d.steps, 0) / loggedDays.length)
    : 0;
  const badges = computeBadges({
    history: allHistory,
    dailyGoal,
    longestStreakDays: longestStreak(allHistory, dailyGoal),
    crownsWon: crowns,
  });
  const milestoneBadges = milestoneDefs.map((m) => ({
    id: m.id,
    name: m.name,
    color: m.color,
    earned: isMilestoneEarned(m, timedHistory),
  }));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <MemberAvatar emoji={member.emoji} color={member.color} size={56} />
        <div>
          <h1 className="font-display text-3xl leading-none">
            {member.name}
            {member.id === selfId && <span className="text-muted text-lg"> (you)</span>}
          </h1>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Streak" value={`${currentStreak} 🔥`} />
        <Stat label="Crowns won" value={`${crowns} 👑`} />
        <Stat label="Best day" value={best.steps.toLocaleString()} />
        <Stat label="Lifetime avg" value={average.toLocaleString()} />
      </div>

      <section className="flex flex-col gap-3">
        <p className="font-medium">Badges</p>
        <BadgeRow badges={badges} />
      </section>

      {milestoneBadges.length > 0 && (
        <section className="flex flex-col gap-3">
          <p className="font-medium">Milestones</p>
          <MilestoneBadgeRow badges={milestoneBadges} />
        </section>
      )}

      <div className="rounded-2xl border border-border bg-surface p-4">
        <p className="font-medium mb-3">Last 30 days</p>
        <StepsChart data={chartHistory} color={member.color} goal={dailyGoal} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-display text-2xl mt-1">{value}</p>
    </div>
  );
}
