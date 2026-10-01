import { eq } from "drizzle-orm";
import { db } from "@/db";
import { members, notificationPrefs } from "@/db/schema";
import { hashToken, generateToken } from "@/lib/tokens";

const AVATAR_COLORS = ["#22d3ee", "#f97316", "#a855f7", "#22c55e", "#f43f5e", "#eab308", "#60a5fa", "#fb7185"];

export async function listMembers() {
  return db.select().from(members).orderBy(members.createdAt);
}

/** Self-serve creation: whoever knows the room PIN can add themselves, no admin step. */
export async function createMember(name: string, emoji: string) {
  const existing = await listMembers();
  const color = AVATAR_COLORS[existing.length % AVATAR_COLORS.length];

  const [member] = await db
    .insert(members)
    .values({
      name,
      emoji,
      color,
      source: "manual",
      tokenHash: hashToken(generateToken()),
    })
    .returning();

  await ensureNotificationPrefs(member.id);
  return member;
}

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
