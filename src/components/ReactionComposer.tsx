"use client";

import { useState } from "react";

type MemberOption = { id: string; name: string; emoji: string };

const QUICK_EMOJI = ["🔥", "👀", "😤", "💀", "😂", "👏"];

export function ReactionComposer({ members, defaultTargetId }: { members: MemberOption[]; defaultTargetId?: string }) {
  const [target, setTarget] = useState(defaultTargetId ?? members[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  async function send(emoji?: string) {
    if (!target) return;
    if (!emoji && !message.trim()) return;
    await fetch("/api/reactions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ toMember: target, emoji, message: message.trim() || undefined }),
    });
    setMessage("");
    setSent(true);
    setTimeout(() => setSent(false), 1200);
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-3 flex flex-col gap-2">
      <select
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        className="bg-background rounded-lg border border-border px-2 py-1.5 text-sm"
      >
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.emoji} {m.name}
          </option>
        ))}
      </select>
      <div className="flex gap-1.5 flex-wrap">
        {QUICK_EMOJI.map((e) => (
          <button
            key={e}
            onClick={() => send(e)}
            className="text-lg rounded-full bg-background border border-border w-9 h-9 cursor-pointer"
          >
            {e}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Trash talk…"
          maxLength={140}
          className="flex-1 bg-background rounded-lg border border-border px-3 py-2 text-sm"
        />
        <button
          onClick={() => send()}
          className="rounded-lg bg-accent text-accent-foreground px-4 text-sm font-medium cursor-pointer"
        >
          {sent ? "Sent" : "Send"}
        </button>
      </div>
    </div>
  );
}
