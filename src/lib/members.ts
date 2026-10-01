import { eq } from "drizzle-orm";
import { db } from "@/db";
import { members, notificationPrefs } from "@/db/schema";
import { hashToken } from "@/lib/tokens";

export async function getMemberByToken(rawToken: string) {
  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.tokenHash, hashToken(rawToken)));
  return member ?? null;
}

export async function getMemberById(id: string) {
  const [member] = await db.select().from(members).where(eq(members.id, id));
  return member ?? null;
}

export async function ensureNotificationPrefs(memberId: string) {
  const [existing] = await db
    .select()
    .from(notificationPrefs)
    .where(eq(notificationPrefs.memberId, memberId));
  if (existing) return existing;
  const [created] = await db.insert(notificationPrefs).values({ memberId }).returning();
  return created;
}
