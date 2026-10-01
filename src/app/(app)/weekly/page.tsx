import { db } from "@/db";
import { settings as settingsTable, dailySteps, members } from "@/db/schema";
import { and, gte, lte } from "drizzle-orm";
import { previousWeekRange } from "@/lib/timezone";
import { getAllTimeGroupTotal } from "@/lib/leaderboard";
import { MemberAvatar } from "@/components/MemberAvatar";

export const dynamic = "force-dynamic";

export default async function WeeklyPage() {
  const { startKey, endKey } = previousWeekRange();
  const [allMembers, rows, settingsRow, groupTotal] = await Promise.all([
    db.select().from(members),
    db
      .select()
      .from(dailySteps)
      .where(and(gte(dailySteps.date, startKey), lte(dailySteps.date, endKey))),
    db.select().from(settingsTable).then((r) => r[0]),
    getAllTimeGroupTotal(),
  ]);

  const totals = new Map<string, number>();
  let bestDay = { memberId: "", date: "", steps: 0 };
  for (const row of rows) {
    totals.set(row.memberId, (totals.get(row.memberId) ?? 0) + row.steps);
    if (row.steps > bestDay.steps) bestDay = { memberId: row.memberId, date: row.date, steps: row.steps };
  }

  const standings = allMembers
    .map((m) => ({ member: m, steps: totals.get(m.id) ?? 0 }))
    .sort((a, b) => b.steps - a.steps);

  const winner = standings[0];
  const bestDayMember = allMembers.find((m) => m.id === bestDay.memberId);
  const groupGoalSteps = settingsRow?.groupGoalSteps ?? null;
  const progressPct = groupGoalSteps ? Math.min(100, Math.round((groupTotal / groupGoalSteps) * 100)) : null;

  return (
    <div className="flex flex-col gap-8 items-center text-center pt-6">
      <p className="text-sm text-muted">{startKey} – {endKey}</p>

      {winner && (
        <div className="flex flex-col items-center gap-3 animate-fade-up">
          <div className="animate-crown-pop text-5xl">👑</div>
          <MemberAvatar emoji={winner.member.emoji} color={winner.member.color} size={88} ring />
          <h1 className="font-display text-4xl">{winner.member.name} wins the week!</h1>
          <p className="font-display text-2xl text-accent">{winner.steps.toLocaleString()} steps</p>
        </div>
      )}

      <div className="w-full flex flex-col gap-2">
        {standings.map((row, i) => (
          <div
            key={row.member.id}
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-3 text-left"
          >
            <span className="font-display text-xl w-5 text-muted">{i + 1}</span>
            <MemberAvatar emoji={row.member.emoji} color={row.member.color} size={36} />
            <span className="flex-1 font-medium">{row.member.name}</span>
            <span className="font-display text-lg">{row.steps.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {bestDayMember && (
        <p className="text-sm text-muted">
          Best single day: <span className="text-foreground font-medium">{bestDayMember.name}</span> with{" "}
          {bestDay.steps.toLocaleString()} on {bestDay.date}
        </p>
      )}

      {groupGoalSteps && progressPct !== null && (
        <div className="w-full rounded-2xl border border-border bg-surface p-4 text-left">
          <div className="flex items-baseline justify-between mb-2">
            <p className="font-medium">{settingsRow?.groupGoalName ?? "Group goal"}</p>
            <p className="text-sm text-muted">{progressPct}%</p>
          </div>
          <div className="h-3 rounded-full bg-background overflow-hidden">
            <div className="h-full rounded-full bg-accent" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      {settingsRow?.stakeText && (
        <p className="text-sm italic text-muted">{settingsRow.stakeText}</p>
      )}
    </div>
  );
}
