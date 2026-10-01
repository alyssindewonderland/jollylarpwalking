import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { getSessionMemberId } from "@/lib/auth";
import { ensureNotificationPrefs } from "@/lib/members";

const bodySchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

export async function POST(req: NextRequest) {
  const memberId = await getSessionMemberId();
  if (!memberId) return NextResponse.json({ error: "not signed in" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  await ensureNotificationPrefs(memberId);

  await db
    .insert(pushSubscriptions)
    .values({
      memberId,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { memberId, p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth },
    });

  return NextResponse.json({ ok: true });
}
