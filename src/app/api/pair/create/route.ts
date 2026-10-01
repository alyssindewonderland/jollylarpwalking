import { NextResponse } from "next/server";
import { db } from "@/db";
import { pairingCodes } from "@/db/schema";
import { getSessionMemberId, generatePairingCode } from "@/lib/auth";

const CODE_TTL_MS = 10 * 60 * 1000;

export async function POST() {
  const memberId = await getSessionMemberId();
  if (!memberId) return NextResponse.json({ error: "not signed in" }, { status: 401 });

  // Collisions are astronomically unlikely across 5 users; retry once just in case.
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generatePairingCode();
    try {
      await db.insert(pairingCodes).values({
        code,
        memberId,
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      });
      return NextResponse.json({ code, expiresInSeconds: CODE_TTL_MS / 1000 });
    } catch {
      continue;
    }
  }
  return NextResponse.json({ error: "could not generate code" }, { status: 500 });
}
