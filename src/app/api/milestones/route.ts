import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionMemberId } from "@/lib/auth";
import { listMilestones, createMilestone } from "@/lib/milestones";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(40),
  thresholdSteps: z.number().int().min(100).max(200_000),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  beforeTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .nullable()
    .optional(),
});

export async function GET() {
  const rows = await listMilestones();
  return NextResponse.json({ milestones: rows });
}

export async function POST(req: NextRequest) {
  if (!(await getSessionMemberId())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const milestone = await createMilestone({
    name: parsed.data.name,
    thresholdSteps: parsed.data.thresholdSteps,
    color: parsed.data.color,
    beforeTime: parsed.data.beforeTime ?? null,
  });
  return NextResponse.json({ milestone });
}
