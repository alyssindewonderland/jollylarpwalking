import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pairingCodes } from "@/db/schema";
import { setSessionCookie } from "@/lib/auth";

const bodySchema = z.object({ code: z.string().length(6) });

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid code" }, { status: 400 });

  const [row] = await db
    .select()
    .from(pairingCodes)
    .where(eq(pairingCodes.code, parsed.data.code));

  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "code expired or invalid" }, { status: 400 });
  }

  await db.update(pairingCodes).set({ usedAt: new Date() }).where(eq(pairingCodes.code, row.code));
  await setSessionCookie(row.memberId);

  return NextResponse.json({ ok: true });
}
