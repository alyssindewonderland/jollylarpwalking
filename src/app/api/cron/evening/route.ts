import { NextRequest, NextResponse } from "next/server";
import { runCloseRaceCheck } from "@/lib/notifications/engine";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await runCloseRaceCheck();
  return NextResponse.json({ ok: true });
}
