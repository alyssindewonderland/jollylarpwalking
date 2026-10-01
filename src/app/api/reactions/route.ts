import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { reactions, members } from "@/db/schema";
import { getSessionMemberId } from "@/lib/auth";
import { reactionCopy } from "@/lib/notifications/copy";
import { checkAndRecordDedupe, sendToMember } from "@/lib/notifications/send";
import { REACTION_BATCH_WINDOW_MS } from "@/lib/notifications/rules";

const bodySchema = z.object({
  toMember: z.string().uuid(),
  eventId: z.string().uuid().optional(),
  emoji: z.string().max(8).optional(),
  message: z.string().max(140).optional(),
});

export async function POST(req: NextRequest) {
  const fromMember = await getSessionMemberId();
  if (!fromMember) return NextResponse.json({ error: "not signed in" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });
  if (!parsed.data.emoji && !parsed.data.message) {
    return NextResponse.json({ error: "emoji or message required" }, { status: 400 });
  }

  const [actor] = await db.select().from(members).where(eq(members.id, fromMember));

  const [row] = await db
    .insert(reactions)
    .values({
      fromMember,
      toMember: parsed.data.toMember,
      eventId: parsed.data.eventId,
      emoji: parsed.data.emoji,
      message: parsed.data.message,
    })
    .returning();

  const canSend = await checkAndRecordDedupe(
    parsed.data.toMember,
    "reaction",
    `reaction:${parsed.data.toMember}`,
    REACTION_BATCH_WINDOW_MS,
  );
  if (canSend && actor) {
    await sendToMember(
      parsed.data.toMember,
      "reaction",
      `${actor.name} sent something`,
      reactionCopy({ actor: actor.name, emoji: parsed.data.emoji, message: parsed.data.message }),
      "/activity",
    );
  }

  return NextResponse.json({ ok: true, reaction: row });
}

export async function GET() {
  const rows = await db.select().from(reactions).orderBy(desc(reactions.createdAt)).limit(100);
  return NextResponse.json({ reactions: rows });
}
