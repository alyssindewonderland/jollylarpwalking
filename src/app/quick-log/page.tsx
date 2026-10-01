import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { dailySteps, settings as settingsTable } from "@/db/schema";
import { getSessionMemberId } from "@/lib/auth";
import { getMemberById } from "@/lib/members";
import { todayKey } from "@/lib/timezone";
import { QuickLogScreen } from "@/components/QuickLogScreen";

export const dynamic = "force-dynamic";

export default async function QuickLogPage() {
  const memberId = (await getSessionMemberId())!;
  const [member, settingsRow, [todayRow]] = await Promise.all([
    getMemberById(memberId),
    db.select().from(settingsTable).then((r) => r[0]),
    db
      .select()
      .from(dailySteps)
      .where(and(eq(dailySteps.memberId, memberId), eq(dailySteps.date, todayKey()))),
  ]);

  return (
    <QuickLogScreen
      color={member?.color ?? "#22d3ee"}
      dailyGoal={settingsRow?.dailyGoal ?? 8000}
      initialSteps={todayRow?.steps ?? 0}
    />
  );
}
