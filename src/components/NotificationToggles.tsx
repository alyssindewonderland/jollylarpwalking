"use client";

import { useState } from "react";

type Prefs = {
  overtakes: boolean;
  closeRace: boolean;
  weekly: boolean;
  reminders: boolean;
  reactions: boolean;
};

const LABELS: { key: keyof Prefs; label: string; hint: string }[] = [
  { key: "overtakes", label: "Overtakes & rank changes", hint: "When someone passes you or takes #1" },
  { key: "closeRace", label: "Close race nudges", hint: "Evening nudge when it's tight" },
  { key: "reminders", label: "Daily reminders", hint: "If you haven't logged/synced today" },
  { key: "reactions", label: "Reactions & trash talk", hint: "When someone reacts to you" },
  { key: "weekly", label: "Weekly recap", hint: "Sunday night results" },
];

export function NotificationToggles({ initial }: { initial: Prefs }) {
  const [prefs, setPrefs] = useState(initial);

  async function toggle(key: keyof Prefs) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    await fetch("/api/prefs", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ [key]: next[key] }),
    });
  }

  return (
    <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface overflow-hidden">
      {LABELS.map(({ key, label, hint }) => (
        <button
          key={key}
          onClick={() => toggle(key)}
          className="flex items-center justify-between gap-4 p-4 text-left cursor-pointer"
        >
          <div>
            <p className="font-medium">{label}</p>
            <p className="text-xs text-muted mt-0.5">{hint}</p>
          </div>
          <div
            className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
              prefs[key] ? "bg-accent" : "bg-border"
            }`}
          >
            <div
              className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${
                prefs[key] ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </div>
        </button>
      ))}
    </div>
  );
}
