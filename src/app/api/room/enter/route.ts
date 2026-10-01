import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRoomPin, setRoomCookie } from "@/lib/room";

const bodySchema = z.object({ pin: z.string().length(4) });

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  if (!checkRoomPin(parsed.data.pin)) {
    return NextResponse.json({ error: "wrong pin" }, { status: 401 });
  }

  await setRoomCookie();
  return NextResponse.json({ ok: true });
}
