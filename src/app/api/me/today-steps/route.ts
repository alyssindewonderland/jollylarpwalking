import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { dailySteps } from "@/db/schema";
import { getSessionMemberId } from "@/lib/auth";
import { todayKey } from "@/lib/timezone";

export async function GET() {
  const memberId = await getSessionMemberId();
  if (!memberId) return NextResponse.json({ error: "not signed in" }, { status: 401 });

  const [row] = await db
    .select()
    .from(dailySteps)
    .where(and(eq(dailySteps.memberId, memberId), eq(dailySteps.date, todayKey())));

  return NextResponse.json({ steps: row?.steps ?? 0 });
}
