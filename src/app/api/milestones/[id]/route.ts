import { NextResponse } from "next/server";
import { getSessionMemberId } from "@/lib/auth";
import { deleteMilestone } from "@/lib/milestones";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionMemberId())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  await deleteMilestone(id);
  return NextResponse.json({ ok: true });
}
