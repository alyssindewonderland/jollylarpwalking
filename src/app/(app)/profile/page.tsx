import { db } from "@/db";
import { settings as settingsTable } from "@/db/schema";
import { getSessionMemberId } from "@/lib/auth";
import { getMemberById } from "@/lib/members";
import { getMemberHistory, getStreak, getCrownCounts } from "@/lib/leaderboard";
import { MemberAvatar } from "@/components/MemberAvatar";
import { StepsChart } from "@/components/StepsChart";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const memberId = (await getSessionMemberId())!;
  const member = (await getMemberById(memberId))!;
  const [settingsRow] = await db.select().from(settingsTable);
  const dailyGoal = settingsRow?.dailyGoal ?? 8000;

  const [history, streak, crownCounts] = await Promise.all([
    getMemberHistory(memberId, 30),
    getStreak(memberId, dailyGoal),
    getCrownCounts(),
  ]);

  const best = history.reduce((a, b) => (b.steps > a.steps ? b : a), history[0]);
  const average = Math.round(history.reduce((sum, d) => sum + d.steps, 0) / history.length);
  const crowns = crownCounts.get(memberId) ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <MemberAvatar emoji={member.emoji} color={member.color} size={56} />
        <div>
          <h1 className="font-display text-3xl leading-none">{member.name}</h1>
          <p className="text-sm text-muted mt-1">
            {member.source === "shortcut" ? "Synced via Shortcut" : "Manual log"}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Streak" value={`${streak} 🔥`} />
        <Stat label="Crowns won" value={`${crowns} 👑`} />
        <Stat label="Best day" value={best.steps.toLocaleString()} />
        <Stat label="30-day avg" value={average.toLocaleString()} />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <p className="font-medium mb-3">Last 30 days</p>
        <StepsChart data={history} color={member.color} goal={dailyGoal} />
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
