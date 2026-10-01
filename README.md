# Stride

A private steps competition for ~5 friends. No sharing to Instagram or anywhere else — everything
(leaderboard, trash talk, weekly results) lives in this app and is driven by push notifications.

No accounts, no per-person invite links, no admin role — one shared 4-digit room PIN gets anyone
in, and everyone can edit goals, challenges, and their own profile. Steps are logged manually
(one tap a day); iOS Shortcut auto-sync exists in the codebase but is intentionally dormant.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind v4, deployed on Vercel.
- Postgres on [Neon](https://neon.tech), via [Drizzle ORM](https://orm.drizzle.team) (chosen over
  Prisma: no codegen/engine binary, faster cold starts on Vercel's serverless functions, and the
  schema is small and fully custom so Prisma's extra tooling buys nothing here).
- Installable PWA (manifest, service worker, standalone display) + Web Push with VAPID.
- Vercel Cron for the three scheduled jobs (evening close-race check, evening reminders, Sunday recap).

## One-time setup

1. **Install dependencies** (already done if you're reading this right after the initial build):
   ```bash
   npm install
   ```

2. **Create a Neon Postgres project** at https://neon.tech (free tier is plenty for 5 people).
   Copy the **pooled** connection string from the Neon dashboard (Connect → pooled connection) and
   paste it into `.env.local` as `DATABASE_URL`. `.env.local` already has a generated
   `SESSION_SECRET`, `ROOM_PIN`, `CRON_SECRET`, and VAPID keypair — only `DATABASE_URL` is
   missing. See `.env.example` for what every variable does.

3. **Push the schema to Neon:**
   ```bash
   npm run db:push
   ```

4. **Seed fake data** (5 fake members, 60 days of history) so the app looks alive immediately:
   ```bash
   npm run seed
   ```
   This wipes and recreates everything, including clearing any group goal, so the home screen
   starts clean (no "claimed space" for a goal until someone sets one).

5. **Run it:**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000, enter the `ROOM_PIN` from `.env.local`, and either pick one of the
   seeded fake members or create a new real person — same flow everyone else uses.

## How getting in works

There's no sign-up, no per-person link, no admin gate:

1. **`/enter`** — type the 4-digit `ROOM_PIN`. Anyone who knows it gets into the room. This sets a
   long-lived `stride_room` cookie on that device.
2. **`/who`** — "who are you?" Pick an existing member's avatar, or tap **+ New person** to create
   yourself (name + sticker avatar, no admin step). This sets the actual `stride_session` cookie
   that identifies you going forward.
3. From then on, that device goes straight to the leaderboard.

**Why this also solves the iOS "installed app has separate storage" problem:** a home-screen web
app's cookies are isolated from Safari's. With the old invite-link design this needed a whole
pairing-code handoff. Now it doesn't matter — opening the freshly-installed icon just has no
cookies yet, so it shows `/enter` again; you type the PIN (which you already know) and tap your
own avatar from `/who` instead of recreating yourself. No code to transfer between contexts.

Nobody is special — any signed-in member can open **Edit room** (the avatar button, top right) to
rename themselves, change their sticker, flip their own notification toggles, and edit the shared
room settings (daily goal, group goal, stakes). There's intentionally no separate admin role.

## Structure, on purpose

Per the brief, this is meant to feel like one stylized room, not an app with sections. The bottom
bar has exactly two destinations — the leaderboard ("Board") and the activity feed — styled as a
HUD, not a conventional tab bar. Everything else (your profile, notifications, room settings)
lives in the slide-up **Edit room** sheet, not separate pages. Tapping anyone's row on the
leaderboard (including your own) opens their profile: streak, crowns, badges, and a 30-day chart.

## Badges

Computed on the fly from existing step history (`src/lib/badges.ts`) — not a separate tracked
table, since recomputing from `daily_steps` is cheap at this scale: 7-day streak, 14-day streak,
20k Club (any 20k+ day), Crown Holder, Goal Getter (10+ goal days lifetime), Veteran (30+ logged
days). Easy to extend — add an entry to `computeBadges` and it shows up everywhere badges render.

## Local dev tools

- `/dev` — fires a real push notification (every copy variant, picked at random) to a chosen
  member so you can see exactly what lands on your phone, plus a link to preview the full-screen
  weekly recap screen. Needs a member session (any member, not a special role).
- `npm run icons` — regenerates the placeholder PWA icons in `public/icons`. Swap in real artwork
  whenever; this script's only job was making the app installable on day one.

## About iOS Shortcut auto-sync (currently dormant)

The original plan synced steps automatically via an iOS Shortcut triggered by a silent "when
Instagram opens" personal automation, authenticated with a per-member bearer token
(`src/lib/tokens.ts`, `POST /api/steps`). That ingestion endpoint still exists and still works —
it's idempotent (upserts by member+date), silently no-ops calls within 5 minutes of the last one,
and rejects future dates — but there's no UI flow to mint/display a token anymore, since
onboarding was simplified down to just the PIN + picker. Reviving it means re-adding a screen that
calls `createMember`/an equivalent to surface a raw token (see git history around the first
onboarding wizard for the full Shortcut-building walkthrough and the exact Shortcuts actions used).

## Known limitations / things to revisit

- **Vercel Hobby cron is UTC-only and fires "within the hour", not at an exact minute.** The three
  cron times in `vercel.json` are hardcoded in UTC for **Europe/Rome summer time (CEST, UTC+2)**.
  When Rome switches to winter time (CET, UTC+1) — next around late October — the schedules will
  drift an hour earlier locally. Fix: shift each cron's UTC hour by +1 in `vercel.json` and
  redeploy. (This only affects the *scheduled* notification times; day boundaries, "today", and
  the Monday-Sunday week shown in the app are computed from `GROUP_TIMEZONE` directly and are
  always correct regardless of DST.)
- **The `middleware.ts` convention is deprecated** in this Next.js version in favor of a `proxy.ts`
  file with the same shape. It still works today (just a build-time warning); run
  `npx @next/codemod@canary middleware-to-proxy .` on a clean git tree whenever it's convenient to
  migrate.
- **No queued/delayed delivery for quiet hours.** A live notification (overtake, lead change,
  milestone, reaction) that would fire between 23:00–08:00 local is simply dropped, not delayed to
  08:00. Given the volume for 5 friends this is unlikely to matter much in practice.
- **Placeholder app icons.** `public/icons` has a generated "S" wordmark so the PWA installs
  properly today; swap in real artwork whenever (`scripts/generate-icons.ts` shows how they were
  made, or just replace the PNGs directly — sizes are documented in `src/app/manifest.ts`).
- **Trust-based room membership.** Anyone with the PIN can create a member, edit any room setting,
  and (by design) there's no per-person password beyond "you tapped your own avatar." This is
  intentional for 5 close friends ("drop the security") — don't reuse this pattern somewhere that
  needs real access control.

## Tests

```bash
npm run test
```

Covers the pure decision logic deliberately kept DB-free for this reason: overtake/lead-change/
milestone detection, the 5-minute ingestion rate limit, close-race/streak-risk thresholds, quiet
hours and week-boundary math across DST-observing dates, the ingestion request schema (auth shape,
date/steps validation, bounds), and the copy template pools (variety count, no leftover `{placeholder}`
text after rendering). Ingestion/notification behavior that touches the database (upserts, the
per-pair/per-day dedupe counters) is exercised through this pure-logic layer rather than through a
live test database, which this project doesn't have wired up — add one if that coverage gap starts
to matter.
