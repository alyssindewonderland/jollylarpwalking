"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MemberAvatar } from "@/components/MemberAvatar";
import { StickerPicker } from "@/components/StickerPicker";

type Member = { id: string; name: string; emoji: string; color: string };
type Prefs = {
  overtakes: boolean;
  closeRace: boolean;
  weekly: boolean;
  reminders: boolean;
  reactions: boolean;
};
type Settings = {
  dailyGoal: number;
  groupGoalName: string | null;
  groupGoalSteps: number | null;
  stakeText: string | null;
};

const PREF_LABELS: { key: keyof Prefs; label: string }[] = [
  { key: "overtakes", label: "Overtakes & rank changes" },
  { key: "closeRace", label: "Close race nudges" },
  { key: "reminders", label: "Daily reminders" },
  { key: "reactions", label: "Reactions & trash talk" },
  { key: "weekly", label: "Weekly recap" },
];

export function RoomHeader({ initialMember }: { initialMember: Member }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full cursor-pointer"
        aria-label="Edit room"
      >
        <MemberAvatar emoji={initialMember.emoji} color={initialMember.color} size={38} ring />
      </button>
      {open && <RoomSheet member={initialMember} onClose={() => setOpen(false)} />}
    </>
  );
}

function RoomSheet({ member, onClose }: { member: Member; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(member.name);
  const [emoji, setEmoji] = useState(member.emoji);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [savedPing, setSavedPing] = useState(false);

  useEffect(() => {
    fetch("/api/prefs")
      .then((r) => r.json())
      .then((d) => setPrefs(d.prefs));
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => d.settings && setSettings(d.settings));
  }, []);

  function ping() {
    setSavedPing(true);
    setTimeout(() => setSavedPing(false), 900);
  }

  async function saveProfile() {
    await fetch("/api/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, emoji }),
    });
    ping();
    router.refresh();
  }

  async function togglePref(key: keyof Prefs) {
    if (!prefs) return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    await fetch("/api/prefs", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ [key]: next[key] }),
    });
  }

  async function saveSettings() {
    if (!settings) return;
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(settings),
    });
    ping();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-background rounded-t-3xl border-t border-border max-h-[85vh] overflow-y-auto safe-bottom">
        <div className="sticky top-0 bg-background flex items-center justify-between px-5 pt-4 pb-2 border-b border-border">
          <h2 className="font-display text-2xl">Edit room</h2>
          <button onClick={onClose} className="text-muted text-sm cursor-pointer">
            Done
          </button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h3 className="text-xs uppercase tracking-wide text-muted">You</h3>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-surface border border-border rounded-xl px-4 py-2.5"
            />
            <StickerPicker value={emoji} onChange={setEmoji} />
            <button
              onClick={saveProfile}
              className="self-start rounded-full bg-accent text-accent-foreground text-sm font-medium px-4 py-2 cursor-pointer"
            >
              {savedPing ? "Saved ✓" : "Save"}
            </button>
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-xs uppercase tracking-wide text-muted">Notifications</h3>
            <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface overflow-hidden">
              {PREF_LABELS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => togglePref(key)}
                  className="flex items-center justify-between gap-4 p-3.5 text-left cursor-pointer"
                >
                  <p className="text-sm">{label}</p>
                  <div
                    className={`relative shrink-0 w-10 h-5.5 rounded-full transition-colors ${
                      prefs?.[key] ? "bg-accent" : "bg-border"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 size-4.5 rounded-full bg-white transition-transform ${
                        prefs?.[key] ? "translate-x-[18px]" : "translate-x-0.5"
                      }`}
                    />
                  </div>
                </button>
              ))}
            </div>
          </section>

          {settings && (
            <section className="flex flex-col gap-3">
              <h3 className="text-xs uppercase tracking-wide text-muted">Room settings</h3>
              <label className="text-sm flex flex-col gap-1">
                Daily goal
                <input
                  type="number"
                  value={settings.dailyGoal}
                  onChange={(e) => setSettings({ ...settings, dailyGoal: Number(e.target.value) })}
                  className="bg-surface border border-border rounded-xl px-3 py-2"
                />
              </label>
              <label className="text-sm flex flex-col gap-1">
                Group goal name
                <input
                  value={settings.groupGoalName ?? ""}
                  onChange={(e) => setSettings({ ...settings, groupGoalName: e.target.value || null })}
                  placeholder="e.g. Walk to Paris"
                  className="bg-surface border border-border rounded-xl px-3 py-2"
                />
              </label>
              <label className="text-sm flex flex-col gap-1">
                Group goal steps
                <input
                  type="number"
                  value={settings.groupGoalSteps ?? ""}
                  onChange={(e) =>
                    setSettings({ ...settings, groupGoalSteps: Number(e.target.value) || null })
                  }
                  placeholder="leave blank to hide"
                  className="bg-surface border border-border rounded-xl px-3 py-2"
                />
              </label>
              <label className="text-sm flex flex-col gap-1">
                Stakes
                <input
                  value={settings.stakeText ?? ""}
                  onChange={(e) => setSettings({ ...settings, stakeText: e.target.value || null })}
                  placeholder="e.g. Loser buys the drinks"
                  className="bg-surface border border-border rounded-xl px-3 py-2"
                />
              </label>
              <button
                onClick={saveSettings}
                className="self-start rounded-full bg-accent text-accent-foreground text-sm font-medium px-4 py-2 cursor-pointer"
              >
                {savedPing ? "Saved ✓" : "Save"}
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
