import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { setAdminCookie } from "@/lib/auth";

const bodySchema = z.object({ secret: z.string() });

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  if (!process.env.ADMIN_SECRET || parsed.data.secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "wrong secret" }, { status: 401 });
  }

  await setAdminCookie();
  return NextResponse.json({ ok: true });
}
