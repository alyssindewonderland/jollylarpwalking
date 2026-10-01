// Seeds 5 fake members with 60 days of step history, so the app looks alive before
// anyone has synced real data. Safe to re-run: it wipes and recreates everything.
import { db } from "../src/db";
import {
  members,
  dailySteps,
  notificationPrefs,
  settings,
  events,
  reactions,
  pushSubscriptions,
  notificationLog,
} from "../src/db/schema";
import { hashToken, generateToken } from "../src/lib/tokens";
import { format, subDays } from "date-fns";

const FAKE_MEMBERS = [
  { name: "Mara", emoji: "🐆", color: "#22d3ee", baseline: 9000, volatility: 4000 },
  { name: "Luca", emoji: "🦁", color: "#f97316", baseline: 11000, volatility: 5000 },
  { name: "Sofia", emoji: "🦊", color: "#a855f7", baseline: 8000, volatility: 3000 },
  { name: "Theo", emoji: "🐢", color: "#22c55e", baseline: 6500, volatility: 2500 },
  { name: "Nina", emoji: "🐇", color: "#f43f5e", baseline: 10000, volatility: 6000 },
];

function randomSteps(baseline: number, volatility: number) {
  const noise = (Math.random() - 0.5) * 2 * volatility;
  return Math.max(0, Math.round(baseline + noise));
}

async function main() {
  console.log("Wiping existing data…");
  await db.delete(notificationLog);
  await db.delete(pushSubscriptions);
  await db.delete(reactions);
  await db.delete(events);
  await db.delete(dailySteps);
  await db.delete(notificationPrefs);
  await db.delete(members);
  await db.delete(settings);

  // No group goal by default — the home screen claims zero space for it until
  // someone sets one from the room sheet.
  await db.insert(settings).values({
    id: 1,
    timezone: process.env.GROUP_TIMEZONE || "Europe/Rome",
    dailyGoal: 8000,
  });

  const insertedMembers = [];
  for (const m of FAKE_MEMBERS) {
    const token = generateToken();
    const [row] = await db
      .insert(members)
      .values({
        name: m.name,
        emoji: m.emoji,
        color: m.color,
        source: "manual",
        tokenHash: hashToken(token),
      })
      .returning();
    await db.insert(notificationPrefs).values({ memberId: row.id });
    insertedMembers.push({ ...row, baseline: m.baseline, volatility: m.volatility });
  }

  console.log("Backfilling 60 days of steps…");
  for (let i = 59; i >= 0; i--) {
    const date = format(subDays(new Date(), i), "yyyy-MM-dd");
    for (const m of insertedMembers) {
      await db.insert(dailySteps).values({
        memberId: m.id,
        date,
        steps: randomSteps(m.baseline, m.volatility),
        source: "manual",
      });
    }
  }

  console.log("Done. Seeded members:", insertedMembers.map((m) => m.name).join(", "));
  console.log(`Room PIN is whatever ROOM_PIN is set to in your .env — use that to get in.`);
}

main().then(() => process.exit(0));
