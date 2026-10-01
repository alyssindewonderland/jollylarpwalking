import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminSession } from "@/lib/auth";
import { sendToMember } from "@/lib/notifications/send";
import {
  overtakeCopy,
  leadChangeCopy,
  milestoneCopy,
  streakCopy,
  closeRaceCopy,
  reminderCopy,
  reactionCopy,
  staleSyncCopy,
  weeklyCopy,
} from "@/lib/notifications/copy";

const bodySchema = z.object({
  memberId: z.string().uuid(),
  type: z.enum([
    "overtake",
    "lead_change",
    "milestone",
    "close_race",
    "reminder",
    "reaction",
    "stale_sync",
    "weekly",
  ]),
});

export async function POST(req: NextRequest) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const { memberId, type } = parsed.data;
  const samples: Record<typeof type, { title: string; body: string; url: string }> = {
    overtake: { title: "You've been passed", body: overtakeCopy({ actor: "Marco", diff: 340 }), url: "/home" },
    lead_change: { title: "New leader", body: leadChangeCopy({ actor: "Marco" }), url: "/home" },
    milestone: { title: "Milestone!", body: milestoneCopy({ actor: "You" }), url: "/home" },
    close_race: { title: "Close race", body: closeRaceCopy({ leader: "Marco", gap: 850 }), url: "/home" },
    reminder: { title: "Log your steps", body: reminderCopy(), url: "/quick-log" },
    reaction: { title: "Marco sent something", body: reactionCopy({ actor: "Marco", emoji: "🔥" }), url: "/activity" },
    stale_sync: { title: "No sync today", body: staleSyncCopy(), url: "/home" },
    weekly: { title: "Week's over 🏆", body: weeklyCopy(), url: "/weekly" },
  };

  // streak is a sub-kind of milestone's copy pool; expose it directly here for preview convenience.
  if (type === "milestone" && Math.random() > 0.5) {
    samples.milestone = { title: "Streak!", body: streakCopy({ actor: "You", streak: 7 }), url: "/profile" };
  }

  const sample = samples[type];
  await sendToMember(memberId, type, sample.title, sample.body, sample.url);

  return NextResponse.json({ ok: true, preview: sample });
}
