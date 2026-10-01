import { eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { members, dailySteps, events, settings } from "@/db/schema";
import { getLeaderboard, getStreak, getCrownHolder, totalsByMemberIds } from "@/lib/leaderboard";
import { todayKey, weekRange } from "@/lib/timezone";
import {
  overtakeCopy,
  leadChangeCopy,
  milestoneCopy,
  streakCopy,
  closeRaceCopy,
  streakRiskCopy,
  reminderCopy,
  staleSyncCopy,
  weeklyCopy,
} from "@/lib/notifications/copy";
import { sendToMember, checkAndRecordDedupe, countSentToday } from "@/lib/notifications/send";
import {
  computeOvertakes,
  isNewLeadChange,
  crossedMilestone,
  crossedStreakMilestone,
  isCloseRace,
  isStreakAtRisk,
  MAX_OVERTAKES_PER_DAY,
  OVERTAKE_PAIR_COOLDOWN_MS,
} from "@/lib/notifications/rules";

async function getSettings() {
  const [row] = await db.select().from(settings);
  return (
    row ?? {
      id: 1,
      timezone: "Europe/Rome",
      dailyGoal: 8000,
      groupGoalName: null,
      groupGoalSteps: null,
      stakeText: null,
    }
  );
}

/**
 * Called right after an ingestion/quick-log upsert for `actorId` changes today's total
 * from `beforeSteps` to `afterSteps`. Detects overtakes, lead changes, and milestones,
 * writes activity-feed events, and fires the relevant pushes (subject to dedupe/quiet hours).
 */
export async function evaluateAfterUpdate(
  actorId: string,
  beforeSteps: number,
  afterSteps: number,
) {
  if (afterSteps <= beforeSteps) return;

  const [actor] = await db.select().from(members).where(eq(members.id, actorId));
  if (!actor) return;

  const others = await db.select().from(members).where(ne(members.id, actorId));
  const today = todayKey();
  const otherTotals = await totalsByMemberIds(
    others.map((m) => m.id),
    today,
    today,
  );

  // Overtakes: anyone whose today total sits strictly between the actor's old and new total.
  const otherRows = others.map((m) => ({ id: m.id, steps: otherTotals.get(m.id) ?? 0 }));
  for (const { id: otherId, diff } of computeOvertakes(beforeSteps, afterSteps, otherRows)) {
    const dedupeKey = `overtake:${actorId}:${otherId}`;
    const [allowedToday, withinCooldown] = await Promise.all([
      countSentToday(otherId, "overtake").then((n) => n < MAX_OVERTAKES_PER_DAY),
      checkAndRecordDedupe(otherId, "overtake", dedupeKey, OVERTAKE_PAIR_COOLDOWN_MS),
    ]);
    await db.insert(events).values({
      type: "overtake",
      payload: { actorId, actorName: actor.name, overtakenId: otherId, diff },
    });
    if (allowedToday && withinCooldown) {
      await sendToMember(otherId, "overtake", "You've been passed", overtakeCopy({ actor: actor.name, diff }), "/home");
    }
  }

  // Lead change: actor newly took sole #1 today.
  if (isNewLeadChange(beforeSteps, afterSteps, otherRows)) {
    await db.insert(events).values({ type: "lead_change", payload: { actorId, actorName: actor.name } });
    for (const m of others) {
      await sendToMember(m.id, "lead_change", "New leader", leadChangeCopy({ actor: actor.name }), "/home");
    }
  }

  // 20k-step milestone.
  if (crossedMilestone(beforeSteps, afterSteps)) {
    await db.insert(events).values({ type: "milestone", payload: { actorId, actorName: actor.name, kind: "20k" } });
    await sendToMember(actorId, "milestone", "Milestone!", milestoneCopy({ actor: actor.name }), "/home");
  }

  // Streak milestones.
  const groupSettings = await getSettings();
  const newStreak = await getStreak(actorId, groupSettings.dailyGoal);
  if (crossedStreakMilestone(newStreak)) {
    await db.insert(events).values({
      type: "milestone",
      payload: { actorId, actorName: actor.name, kind: "streak", streak: newStreak },
    });
    await sendToMember(
      actorId,
      "milestone",
      "Streak!",
      streakCopy({ actor: actor.name, streak: newStreak }),
      "/profile",
    );
  }
}

/** ~20:00 daily cron: nudge anyone close to #1 or about to lose their streak. */
export async function runCloseRaceCheck() {
  const [leaderboard, groupSettings] = await Promise.all([getLeaderboard("today"), getSettings()]);
  const leader = leaderboard[0];
  if (!leader) return;

  for (const row of leaderboard) {
    if (row.rank !== 1 && isCloseRace(row.gapToLeader)) {
      await sendToMember(
        row.member.id,
        "close_race",
        "Close race",
        closeRaceCopy({ leader: leader.member.name, gap: row.gapToLeader }),
        "/home",
      );
      continue;
    }

    const streak = await getStreak(row.member.id, groupSettings.dailyGoal);
    const remaining = groupSettings.dailyGoal - row.steps;
    if (isStreakAtRisk(streak, remaining)) {
      await sendToMember(row.member.id, "close_race", "Streak at risk", streakRiskCopy({ remaining }), "/home");
    }
  }
}

/** ~21:00 daily cron: nudge manual-source members (and stale shortcut syncs) who haven't logged today. */
export async function runReminderCheck() {
  const today = todayKey();
  const allMembers = await db.select().from(members);
  const todaysRows = await db
    .select()
    .from(dailySteps)
    .where(eq(dailySteps.date, today));
  const loggedToday = new Set(todaysRows.map((r) => r.memberId));

  for (const member of allMembers) {
    if (loggedToday.has(member.id)) continue;
    if (member.source === "manual") {
      await sendToMember(member.id, "reminder", "Log your steps", reminderCopy(), "/quick-log");
    } else {
      await sendToMember(member.id, "stale_sync", "No sync today", staleSyncCopy(), "/home");
    }
  }
}

/** Sunday ~21:30 cron: close out the week, hand off the crown, notify everyone. */
export async function runWeeklyRecap() {
  const { startKey, endKey } = weekRange();
  const allMembers = await db.select().from(members);
  const totals = await totalsByMemberIds(
    allMembers.map((m) => m.id),
    startKey,
    endKey,
  );

  const winner = allMembers
    .map((m) => ({ member: m, steps: totals.get(m.id) ?? 0 }))
    .sort((a, b) => b.steps - a.steps)[0];

  const previousCrown = await getCrownHolder();

  await db.insert(events).values({
    type: "weekly_recap",
    payload: {
      weekStart: startKey,
      weekEnd: endKey,
      winnerId: winner?.member.id,
      winnerName: winner?.member.name,
      previousCrownId: previousCrown?.id ?? null,
    },
  });

  if (winner && previousCrown && previousCrown.id !== winner.member.id) {
    await db.insert(events).values({
      type: "crown",
      payload: { fromId: previousCrown.id, toId: winner.member.id, toName: winner.member.name },
    });
  }

  for (const member of allMembers) {
    await sendToMember(member.id, "weekly", "Week's over 🏆", weeklyCopy(), "/weekly");
  }
}
