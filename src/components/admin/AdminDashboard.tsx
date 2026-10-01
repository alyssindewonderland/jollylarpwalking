"use client";

import { useEffect, useState } from "react";

type Member = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  source: "shortcut" | "manual";
  lastSyncedAt: string | null;
};

type Settings = {
  dailyGoal: number;
  groupGoalName: string | null;
  groupGoalSteps: number | null;
  stakeText: string | null;
};

const DEFAULT_COLORS = ["#22d3ee", "#f97316", "#a855f7", "#22c55e", "#f43f5e", "#eab308"];

export function AdminDashboard() {
  const [members, setMembers] = useState<Member[]>([]);
  const [settings, setSettings] = useState<Settings>({
    dailyGoal: 8000,
    groupGoalName: "",
    groupGoalSteps: null,
    stakeText: "",
  });
  const [newInvite, setNewInvite] = useState<{ name: string; token: string } | null>(null);
  const [form, setForm] = useState<{ name: string; emoji: string; color: string; source: "shortcut" | "manual" }>({
    name: "",
    emoji: "🙂",
    color: DEFAULT_COLORS[0],
    source: "manual",
  });

  async function loadMembers() {
    const data = await fetch("/api/admin/members").then((r) => r.json());
    setMembers(data.members ?? []);
  }

  useEffect(() => {
    // Data-loading effect: setState happens after the fetch resolves, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMembers();
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) setSettings(data.settings);
      });
  }, []);

  async function addMember() {
    if (!form.name.trim()) return;
    const res = await fetch("/api/admin/members", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setNewInvite({ name: form.name, token: data.token });
      setForm({ name: "", emoji: "🙂", color: DEFAULT_COLORS[members.length % DEFAULT_COLORS.length], source: "manual" });
      loadMembers();
    }
  }

  async function regenerate(id: string, name: string) {
    const res = await fetch(`/api/admin/members/${id}/regenerate`, { method: "POST" });
    const data = await res.json();
    if (res.ok) setNewInvite({ name, token: data.token });
  }

  async function saveSettings() {
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(settings),
    });
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-3xl">Admin</h1>

      {newInvite && (
        <div className="rounded-2xl border border-accent/50 bg-surface p-4 flex flex-col gap-2">
          <p className="font-medium">Invite link for {newInvite.name}</p>
          <code className="text-xs break-all bg-background rounded-lg p-2">
            {origin}/i/{newInvite.token}
          </code>
          <button
            onClick={() => navigator.clipboard.writeText(`${origin}/i/${newInvite.token}`)}
            className="text-xs rounded-full bg-accent text-accent-foreground px-3 py-1.5 self-start cursor-pointer"
          >
            Copy link
          </button>
          <p className="text-xs text-muted">Shown once — send it to them now.</p>
        </div>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Members</h2>
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
            <span className="text-xl">{m.emoji}</span>
            <div className="flex-1">
              <p className="font-medium">{m.name}</p>
              <p className="text-xs text-muted">
                {m.source === "manual" ? "manual" : "auto-sync"} ·{" "}
                {m.lastSyncedAt
                  ? `last logged ${new Date(m.lastSyncedAt).toLocaleString()}`
                  : "nothing logged yet"}
              </p>
            </div>
            <button
              onClick={() => regenerate(m.id, m.name)}
              className="text-xs rounded-full border border-border px-3 py-1.5 cursor-pointer"
            >
              New invite
            </button>
          </div>
        ))}

        <div className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-3">
          <p className="font-medium">Add member</p>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Name"
            className="bg-background border border-border rounded-xl px-3 py-2"
          />
          <div className="flex gap-2">
            <input
              value={form.emoji}
              onChange={(e) => setForm({ ...form, emoji: e.target.value })}
              className="bg-background border border-border rounded-xl px-3 py-2 w-16 text-center"
            />
            <div className="flex gap-1 items-center">
              {DEFAULT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, color: c })}
                  className="size-7 rounded-full cursor-pointer"
                  style={{ background: c, outline: form.color === c ? "2px solid var(--foreground)" : undefined }}
                />
              ))}
            </div>
          </div>
          <select
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value as "shortcut" | "manual" })}
            className="bg-background border border-border rounded-xl px-3 py-2"
          >
            <option value="manual">Manual entry (recommended)</option>
            <option value="shortcut">Auto-sync via iOS Shortcut (advanced)</option>
          </select>
          <button onClick={addMember} className="rounded-xl bg-accent text-accent-foreground font-medium py-2.5 cursor-pointer">
            Create + generate invite
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Game settings</h2>
        <div className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-3">
          <label className="text-sm flex flex-col gap-1">
            Daily goal
            <input
              type="number"
              value={settings.dailyGoal}
              onChange={(e) => setSettings({ ...settings, dailyGoal: Number(e.target.value) })}
              className="bg-background border border-border rounded-xl px-3 py-2"
            />
          </label>
          <label className="text-sm flex flex-col gap-1">
            Group goal name
            <input
              value={settings.groupGoalName ?? ""}
              onChange={(e) => setSettings({ ...settings, groupGoalName: e.target.value })}
              placeholder="Walk to Paris"
              className="bg-background border border-border rounded-xl px-3 py-2"
            />
          </label>
          <label className="text-sm flex flex-col gap-1">
            Group goal steps
            <input
              type="number"
              value={settings.groupGoalSteps ?? ""}
              onChange={(e) => setSettings({ ...settings, groupGoalSteps: Number(e.target.value) || null })}
              className="bg-background border border-border rounded-xl px-3 py-2"
            />
          </label>
          <label className="text-sm flex flex-col gap-1">
            Stake
            <input
              value={settings.stakeText ?? ""}
              onChange={(e) => setSettings({ ...settings, stakeText: e.target.value })}
              placeholder="Loser buys the drinks"
              className="bg-background border border-border rounded-xl px-3 py-2"
            />
          </label>
          <button onClick={saveSettings} className="rounded-xl bg-accent text-accent-foreground font-medium py-2.5 cursor-pointer">
            Save
          </button>
        </div>
      </section>
    </div>
  );
}
