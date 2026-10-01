export type TemplateVars = Record<string, string | number>;

function render(template: string, vars: TemplateVars): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
}

function pick(templates: string[], vars: TemplateVars): string {
  const t = templates[Math.floor(Math.random() * templates.length)];
  return render(t, vars);
}

export const overtakeTemplates = [
  "{actor} just passed you 👀 (−{diff})",
  "{actor} snuck by. You're down {diff} steps.",
  "Uh oh, {actor} overtook you ({diff} behind now).",
  "{actor} walked right past you. {diff} to make up.",
  "Not on {actor}'s watch — they just took your spot (−{diff}).",
  "{actor} is ahead of you now by {diff} steps.",
  "Plot twist: {actor} just passed you. −{diff}.",
  "{actor} tiptoed past you. {diff} steps to close the gap.",
  "You've been overtaken by {actor} (−{diff}). Get up.",
  "{actor} just stole your spot. Down {diff}.",
  "Heads up — {actor} moved ahead of you by {diff}.",
  "{actor} is cooking today. You're {diff} behind them now.",
  "That's {actor} passing you. −{diff} steps.",
  "{actor} took the lead over you. {diff} to go.",
  "Rude: {actor} just overtook you by {diff} steps.",
];

export const leadChangeTemplates = [
  "👑 New leader: {actor} just took #1!",
  "{actor} just grabbed the crown for today.",
  "Shake-up at the top — {actor} is now #1.",
  "{actor} just took over first place today.",
  "The lead has changed hands: {actor} is on top.",
  "{actor} just walked into first place.",
  "New #1 alert: {actor}.",
  "{actor} just claimed the top spot today.",
  "Look who's #1 now — {actor}.",
  "{actor} just overtook everyone for the lead.",
];

export const milestoneTemplates = [
  "🎉 {actor} just broke 20,000 steps today!",
  "{actor} hit a huge day — 20k+ steps!",
  "Absolute unit: {actor} just passed 20,000 steps today.",
  "{actor} is having a monster day — 20k+!",
  "New personal flex: {actor} crossed 20,000 steps today.",
];

export const streakTemplates = [
  "🔥 {actor} just hit a {streak}-day streak!",
  "{actor} is on fire — {streak} days in a row!",
  "{streak} days straight for {actor}. Unstoppable.",
  "{actor} just locked in day {streak} of their streak.",
  "Consistency king/queen: {actor}, {streak} days running.",
];

export const closeRaceTemplates = [
  "You're only {gap} behind {leader} — still time tonight 👀",
  "So close! {gap} steps between you and {leader}.",
  "{gap} steps from catching {leader}. Go.",
  "It's tight at the top — you're {gap} behind {leader}.",
  "{leader} is only {gap} steps ahead. Get moving.",
  "Last push: close the {gap}-step gap on {leader}.",
  "You could still catch {leader} — just {gap} steps.",
  "{gap} steps separate you from {leader} right now.",
  "Nail-biter: {gap} behind {leader} with hours left.",
  "One more walk could close the {gap}-step gap on {leader}.",
  "You're within striking distance of {leader} ({gap} steps).",
  "Don't let {leader} get away — only {gap} steps back.",
  "The gap to {leader} is just {gap}. Tonight's the night.",
  "{gap} steps stand between you and {leader}. Still time.",
  "You can still pass {leader} tonight — {gap} to go.",
];

export const streakRiskTemplates = [
  "Your streak's on the line — {remaining} steps to go today.",
  "Keep the streak alive: {remaining} steps left today.",
  "Don't break the streak now — {remaining} steps to hit goal.",
  "{remaining} steps stand between you and keeping your streak.",
  "Streak check: {remaining} more steps before midnight.",
  "So close to keeping it going — {remaining} steps left.",
];

export const reminderTemplates = [
  "⏰ Don't forget to log today's steps.",
  "Quick one — log your steps before the day resets.",
  "Your steps are missing today. 10 seconds to log them.",
  "Psst, log today's steps before everyone else does.",
  "The board's waiting on your number for today.",
  "Don't ghost the leaderboard — log your steps.",
  "One tap to log today's steps.",
  "Reminder: today's steps aren't in yet.",
  "Log your steps before bed — keep the streak alive.",
  "Everyone else has logged today. You're up.",
  "Quick log, big impact. Don't skip today.",
  "The leaderboard misses you. Log today's steps.",
  "Last call to log today's steps.",
  "Don't let today be a zero. Log your steps.",
  "Tiny task, big streak: log today's steps.",
];

export const reactionTemplates = [
  "{actor} reacted {emoji} to your day",
  "{actor} sent you {emoji}",
  "{actor} is talking trash: \"{message}\"",
  "{actor} hit you with {emoji}",
  "New message from {actor}: \"{message}\"",
];

export const staleSyncTemplates = [
  "Your steps haven't synced today — open Instagram to sync.",
  "No sync yet today. Open Instagram and it'll update.",
  "Steps are stale — a quick open of Instagram fixes it.",
  "Haven't seen your steps today. Open Instagram to sync.",
  "Your Shortcut hasn't run today. Open Instagram to trigger it.",
];

export const weeklyTemplates = [
  "🏆 The week is over — see who's wearing the crown.",
  "Results are in. Tap to see this week's standings.",
  "Week's final standings are ready.",
  "The crown has a new owner. See who won this week.",
  "Weekly recap is live — see how you did.",
];

export function overtakeCopy(vars: { actor: string; diff: number }) {
  return pick(overtakeTemplates, vars);
}
export function leadChangeCopy(vars: { actor: string }) {
  return pick(leadChangeTemplates, vars);
}
export function milestoneCopy(vars: { actor: string }) {
  return pick(milestoneTemplates, vars);
}
export function streakCopy(vars: { actor: string; streak: number }) {
  return pick(streakTemplates, vars);
}
export function closeRaceCopy(vars: { leader: string; gap: number }) {
  return pick(closeRaceTemplates, vars);
}
export function streakRiskCopy(vars: { remaining: number }) {
  return pick(streakRiskTemplates, vars);
}
export function reminderCopy() {
  return pick(reminderTemplates, {});
}
export function reactionCopy(vars: { actor: string; emoji?: string; message?: string }) {
  return pick(reactionTemplates, vars as TemplateVars);
}
export function staleSyncCopy() {
  return pick(staleSyncTemplates, {});
}
export function weeklyCopy() {
  return pick(weeklyTemplates, {});
}
