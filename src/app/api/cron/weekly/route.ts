import { NextRequest, NextResponse } from "next/server";
import { runWeeklyRecap } from "@/lib/notifications/engine";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  // vercel.json schedules this for Sundays only; double check here too so a manual
  // hit (or a misconfigured schedule) can't re-fire the weekly recap mid-week.
  const isSunday = new Date().getUTCDay() === 0;
  if (!isSunday) return NextResponse.json({ ok: true, skipped: true });
  await runWeeklyRecap();
  return NextResponse.json({ ok: true });
}
