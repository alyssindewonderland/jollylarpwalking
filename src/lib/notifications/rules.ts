// Pure decision logic, deliberately kept free of DB/network calls so it's cheap to unit test.

export const MILESTONE_STEPS = 20_000;
export const STREAK_MILESTONES = [7, 14, 30];
export const MAX_OVERTAKES_PER_DAY = 3;
export const OVERTAKE_PAIR_COOLDOWN_MS = 2 * 60 * 60 * 1000;
export const REACTION_BATCH_WINDOW_MS = 30 * 60 * 1000;
export const INGEST_COOLDOWN_MS = 5 * 60 * 1000;

/** Who the actor's update (beforeSteps -> afterSteps) just overtook today, and by how much. */
export function computeOvertakes(
  beforeSteps: number,
  afterSteps: number,
  others: { id: string; steps: number }[],
): { id: string; diff: number }[] {
  if (afterSteps <= beforeSteps) return [];
  return others
    .filter((o) => o.steps > beforeSteps && o.steps < afterSteps)
    .map((o) => ({ id: o.id, diff: afterSteps - o.steps }));
}

/** True if the actor's update just took sole first place today (wasn't leading before, is now). */
export function isNewLeadChange(
  beforeSteps: number,
  afterSteps: number,
  others: { steps: number }[],
): boolean {
  if (others.length === 0) return false;
  const wasLeading = others.every((o) => beforeSteps >= o.steps);
  const isLeadingNow = others.every((o) => afterSteps > o.steps);
  return !wasLeading && isLeadingNow;
}

export function crossedMilestone(beforeSteps: number, afterSteps: number): boolean {
  return beforeSteps < MILESTONE_STEPS && afterSteps >= MILESTONE_STEPS;
}

export function crossedStreakMilestone(newStreak: number): boolean {
  return STREAK_MILESTONES.includes(newStreak);
}

/** Should this ingestion call be silently no-op'd because one landed too recently? */
export function shouldSkipIngest(lastIngestAt: Date | null, now: Date = new Date()): boolean {
  if (!lastIngestAt) return false;
  return now.getTime() - lastIngestAt.getTime() < INGEST_COOLDOWN_MS;
}

/** Should a close-race nudge fire for someone this many steps behind the leader? */
export function isCloseRace(gapToLeader: number, threshold = 1500): boolean {
  return gapToLeader > 0 && gapToLeader <= threshold;
}

export function isStreakAtRisk(streak: number, remainingToGoal: number, threshold = 1500): boolean {
  return streak > 0 && remainingToGoal > 0 && remainingToGoal <= threshold;
}
