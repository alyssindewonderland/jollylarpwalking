# Stride

A private steps competition for ~5 friends. No sharing to Instagram or anywhere else — everything
(leaderboard, trash talk, weekly results) lives in this app and is driven by push notifications.

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
   `SESSION_SECRET`, `ADMIN_SECRET`, `CRON_SECRET`, and VAPID keypair — only `DATABASE_URL` is
   missing. See `.env.example` for what every variable does.

3. **Push the schema to Neon:**
   ```bash
   npm run db:push
   ```

4. **Seed fake data** (5 fake members, 60 days of history) so the app looks alive immediately:
   ```bash
   npm run seed
   ```
   This prints each fake member's dev-only invite token to the console — useful for testing the
   onboarding flow locally without touching real members.

5. **Run it:**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000/admin and enter the `ADMIN_SECRET` from `.env.local` to create real
   members and generate their invite links.

## Local dev tools

- `/admin` — add members, generate invite links, regenerate tokens, edit the daily goal / group
  goal / stake text. Gated by `ADMIN_SECRET` (a passphrase, not a full auth system — fine for 5
  friends and one admin).
- `/dev` — fires a real push notification (every copy variant, picked at random) to a chosen
  member so you can see exactly what lands on your phone, plus a link to preview the full-screen
  weekly recap screen. Gated by the same admin cookie as `/admin`.
- `npm run icons` — regenerates the placeholder PWA icons in `public/icons`. Swap in real artwork
  whenever; this script's only job was making the app installable on day one.

## Onboarding a friend

1. In `/admin`, add them (name, emoji, color, and source — `shortcut` for iPhone, `manual` for
   Android) and copy their invite link. It's shown once; if it's lost, hit "New invite" to mint a
   fresh one (invalidates the old one).
2. Send them the link. Opening it in **Safari** (not the installed app, not Chrome) sets their
   session and walks them through: Add to Home Screen → a pairing step → enabling notifications →
   connecting their steps.
3. **The iOS storage gotcha, and how this app handles it:** a home-screen web app has separate
   cookie/storage from Safari, so the session set in Safari does *not* carry into the installed
   app. The onboarding flow works around this with a one-time pairing code: after adding to the
   Home Screen, `/pair` in Safari shows a 6-digit code (minted from the Safari session); opening
   the installed app lands on `/pair` with no session, where that code is typed in to establish a
   session *inside* the installed app. Notifications are then requested from inside the installed
   app, where Web Push actually works on iOS (it does not work from a plain Safari tab — iOS
   16.4+ only grants Push API access to installed, standalone-display PWAs).
4. **iPhone (and the Garmin user, who syncs through Apple Health):** the last onboarding step
   shows their personal bearer token and the ingestion URL (`/api/steps`), plus the exact steps to
   build the Shortcut (see below) and a live "waiting for first sync…" indicator that turns green
   automatically once their Shortcut POSTs real data.
5. **Android:** the last step just explains manual logging; they'll get an evening push if they
   haven't logged by then.

### Building the iOS Shortcut (per iPhone user)

Full click-by-click instructions (with the exact Shortcuts actions, the JSON body shape, and how
to set up the silent "when Instagram is opened" automation) are provided interactively when you
set this up — see the chat transcript from when this app was built. The short version, also shown
in-app on the Shortcut setup screen:

1. New shortcut → **Find Health Samples** (Steps, last 7 days, grouped by day).
2. Build a JSON body shaped like `{"days":[{"date":"2026-01-01","steps":8123}, ...]}` from those
   samples.
3. **Get Contents of URL** → POST to `<your-deployed-url>/api/steps`, header
   `Authorization: Bearer <their token>`.
4. Automation tab → **+** → App → Instagram → Is Opened → run this shortcut, with **Ask Before
   Running** and **Notify When Run** both off, so it runs silently.
5. If they also wear a Garmin watch synced into Apple Health: watch for double-counted steps (both
   the phone and the watch recording the same walk). Check the number against the iPhone's Health
   app once after the first sync; if it's inflated, set a source priority in Health (Health app →
   Steps → Data Sources & Access → reorder, or exclude the duplicate source) so only one source
   counts.

The ingestion endpoint is idempotent (upserts by member+date) and silently no-ops calls that land
within 5 minutes of the last one, so firing it often (every time Instagram opens) is fine and
expected — that's the intended design, not a bug.

## Known limitations / things to revisit

- **Personal automations re silence**: iOS's "Open App" personal automation supports running
  fully silently (Ask Before Running + Notify When Run both off) as of iOS 18, which is what makes
  the whole ingestion pipeline work without anyone ever opening Stride directly. If a future iOS
  version tightens this, the fallback is: switch the automation trigger to a fixed daily time
  instead of "app opened" (Shortcuts personal automations also support "Time of Day", which can
  run silently too).
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
