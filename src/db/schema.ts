import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  date,
  uuid,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";

export const members = pgTable("members", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull().default("🙂"),
  color: text("color").notNull().default("#22c55e"),
  tokenHash: text("token_hash").notNull().unique(),
  source: text("source", { enum: ["shortcut", "manual"] }).notNull(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  lastIngestAt: timestamp("last_ingest_at", { withTimezone: true }),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const dailySteps = pgTable(
  "daily_steps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    steps: integer("steps").notNull(),
    source: text("source", { enum: ["shortcut", "manual", "watch"] }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("daily_steps_member_date_unique").on(t.memberId, t.date)],
);

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberId: uuid("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationPrefs = pgTable("notification_prefs", {
  memberId: uuid("member_id")
    .primaryKey()
    .references(() => members.id, { onDelete: "cascade" }),
  overtakes: boolean("overtakes").notNull().default(true),
  closeRace: boolean("close_race").notNull().default(true),
  weekly: boolean("weekly").notNull().default(true),
  reminders: boolean("reminders").notNull().default(true),
  reactions: boolean("reactions").notNull().default(true),
});

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type", {
    enum: [
      "overtake",
      "crown",
      "milestone",
      "lead_change",
      "close_race",
      "reminder",
      "weekly_recap",
      "reaction",
      "trash_talk",
    ],
  }).notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reactions = pgTable("reactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromMember: uuid("from_member")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  toMember: uuid("to_member")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "set null" }),
  emoji: text("emoji"),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Tracks every push actually sent, so anti-spam rules (per-pair cooldowns,
// daily caps, batching windows) survive across serverless invocations.
export const notificationLog = pgTable("notification_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberId: uuid("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  dedupeKey: text("dedupe_key").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pairingCodes = pgTable("pairing_codes", {
  code: text("code").primaryKey(),
  memberId: uuid("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  timezone: text("timezone").notNull().default("Europe/Rome"),
  dailyGoal: integer("daily_goal").notNull().default(8000),
  groupGoalName: text("group_goal_name"),
  groupGoalSteps: integer("group_goal_steps"),
  stakeText: text("stake_text"),
});

export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
export type DailyStep = typeof dailySteps.$inferSelect;
export type EventRow = typeof events.$inferSelect;
export type Settings = typeof settings.$inferSelect;
