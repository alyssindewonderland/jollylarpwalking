import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { milestones, dailySteps, type Milestone } from "@/db/schema";
import { toZonedTime } from "date-fns-tz";
import { GROUP_TIMEZONE } from "@/lib/timezone";

export async function listMilestones(): Promise<Milestone[]> {
  return db.select().from(milestones).orderBy(desc(milestones.thresholdSteps));
}

export async function createMilestone(input: {
  name: string;
  thresholdSteps: number;
  color: string;
  beforeTime: string | null;
}): Promise<Milestone> {
  const [row] = await db.insert(milestones).values(input).returning();
  return row;
}

export async function deleteMilestone(id: string): Promise<void> {
  await db.delete(milestones).where(eq(milestones.id, id));
}

function localTimeOfDay(when: Date, tz: string): string {
  const zoned = toZonedTime(when, tz);
  return `${String(zoned.getHours()).padStart(2, "0")}:${String(zoned.getMinutes()).padStart(2, "0")}`;
}

/**
 * Whether a member has ever earned a given milestone. "Earned" means some day's total reached
 * the threshold; for a time-limited milestone, that day's *last save* also has to have landed
 * before the cutoff -- we only keep one (possibly overwritten) row per day, not a timestamped
 * history of every intermediate value, so this is a best-effort proxy for "hit it by then," not
 * a guarantee. A single lump-sum entry logged at night will never satisfy a "before noon" badge
 * even if the steps genuinely happened earlier in the day.
 */
export function isMilestoneEarned(
  milestone: Pick<Milestone, "thresholdSteps" | "beforeTime">,
  history: { steps: number; updatedAt: Date }[],
): boolean {
  return history.some((day) => {
    if (day.steps < milestone.thresholdSteps) return false;
    if (!milestone.beforeTime) return true;
    return localTimeOfDay(day.updatedAt, GROUP_TIMEZONE) <= milestone.beforeTime;
  });
}

export async function getMemberStepsWithTimestamps(memberId: string) {
  return db
    .select({ steps: dailySteps.steps, updatedAt: dailySteps.updatedAt })
    .from(dailySteps)
    .where(eq(dailySteps.memberId, memberId));
}
