import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { getSessionMemberId } from "@/lib/auth";

const bodySchema = z.object({ endpoint: z.string().url() });

export async function POST(req: NextRequest) {
  const memberId = await getSessionMemberId();
  if (!memberId) return NextResponse.json({ error: "not signed in" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, parsed.data.endpoint));
  return NextResponse.json({ ok: true });
}
