import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { isAdminSession } from "@/lib/auth";

const bodySchema = z.object({
  dailyGoal: z.number().int().min(1000).max(100_000).optional(),
  groupGoalName: z.string().max(80).nullable().optional(),
  groupGoalSteps: z.number().int().min(0).nullable().optional(),
  stakeText: z.string().max(140).nullable().optional(),
});

export async function GET() {
  const [row] = await db.select().from(settings);
  return NextResponse.json({ settings: row ?? null });
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const [existing] = await db.select().from(settings);
  if (!existing) {
    const [created] = await db
      .insert(settings)
      .values({ id: 1, ...parsed.data })
      .returning();
    return NextResponse.json({ settings: created });
  }

  const [updated] = await db
    .update(settings)
    .set(parsed.data)
    .where(eq(settings.id, 1))
    .returning();
  return NextResponse.json({ settings: updated });
}
