import webpush from "web-push";
import { and, eq, gt, gte } from "drizzle-orm";
import { db } from "@/db";
import { pushSubscriptions, notificationPrefs, notificationLog } from "@/db/schema";
import { isQuietHours, todayKey } from "@/lib/timezone";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    throw new Error("VAPID keys are not configured");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export type NotificationType =
  | "overtake"
  | "lead_change"
  | "milestone"
  | "reminder"
  | "close_race"
  | "reaction"
  | "weekly"
  | "stale_sync";

const PREF_KEY: Record<NotificationType, keyof typeof notificationPrefs.$inferSelect | null> = {
  overtake: "overtakes",
  lead_change: "overtakes",
  milestone: "overtakes",
  close_race: "closeRace",
  reminder: "reminders",
  stale_sync: "reminders",
  weekly: "weekly",
  reaction: "reactions",
};

async function memberAllows(memberId: string, type: NotificationType): Promise<boolean> {
  const prefKey = PREF_KEY[type];
  if (!prefKey) return true;
  const [prefs] = await db
    .select()
    .from(notificationPrefs)
    .where(eq(notificationPrefs.memberId, memberId));
  if (!prefs) return true; // default-on until a row exists
  return Boolean(prefs[prefKey]);
}

/** Checks + records a dedupe window. Returns true if sending is allowed right now. */
export async function checkAndRecordDedupe(
  memberId: string,
  type: NotificationType,
  dedupeKey: string,
  cooldownMs: number,
): Promise<boolean> {
  const since = new Date(Date.now() - cooldownMs);
  const [recent] = await db
    .select()
    .from(notificationLog)
    .where(
      and(
        eq(notificationLog.memberId, memberId),
        eq(notificationLog.dedupeKey, dedupeKey),
        gt(notificationLog.sentAt, since),
      ),
    )
    .limit(1);
  if (recent) return false;
  await db.insert(notificationLog).values({ memberId, type, dedupeKey });
  return true;
}

export async function countSentToday(memberId: string, type: NotificationType): Promise<number> {
  const startOfDay = new Date(`${todayKey()}T00:00:00Z`);
  const rows = await db
    .select()
    .from(notificationLog)
    .where(
      and(
        eq(notificationLog.memberId, memberId),
        eq(notificationLog.type, type),
        gte(notificationLog.sentAt, startOfDay),
      ),
    );
  return rows.length;
}

export async function sendToMember(
  memberId: string,
  type: NotificationType,
  title: string,
  body: string,
  url: string,
): Promise<void> {
  if (isQuietHours()) return;
  if (!(await memberAllows(memberId, type))) return;

  ensureConfigured();
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.memberId, memberId));

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({ title, body, url }),
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
        }
      }
    }),
  );
}
