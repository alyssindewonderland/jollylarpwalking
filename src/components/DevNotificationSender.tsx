"use client";

import { useState } from "react";

const TYPES = [
  "overtake",
  "lead_change",
  "milestone",
  "close_race",
  "reminder",
  "reaction",
  "stale_sync",
  "weekly",
] as const;

export function DevNotificationSender({ members }: { members: { id: string; name: string; emoji: string }[] }) {
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [lastSent, setLastSent] = useState<string | null>(null);

  async function send(type: string) {
    const res = await fetch("/api/dev/notifications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ memberId, type }),
    });
    const data = await res.json();
    setLastSent(res.ok ? `${type}: "${data.preview.body}"` : "failed — check they have a push subscription");
  }

  return (
    <div className="flex flex-col gap-3">
      <select
        value={memberId}
        onChange={(e) => setMemberId(e.target.value)}
        className="bg-surface border border-border rounded-xl px-3 py-2"
      >
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.emoji} {m.name}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-2">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => send(t)}
            className="rounded-xl border border-border bg-surface py-2.5 text-sm cursor-pointer"
          >
            {t}
          </button>
        ))}
      </div>
      {lastSent && <p className="text-xs text-muted">{lastSent}</p>}
    </div>
  );
}
