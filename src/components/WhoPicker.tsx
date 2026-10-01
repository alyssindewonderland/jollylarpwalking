"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MemberAvatar } from "@/components/MemberAvatar";
import { StickerPicker } from "@/components/StickerPicker";
import { STICKERS } from "@/lib/stickers";

type RoomMember = { id: string; name: string; emoji: string; color: string };

export function WhoPicker() {
  const router = useRouter();
  const [members, setMembers] = useState<RoomMember[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(STICKERS[0]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/room/members")
      .then((r) => r.json())
      .then((data) => setMembers(data.members ?? []));
  }, []);

  async function claim(memberId: string) {
    setBusy(true);
    const res = await fetch("/api/room/claim", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ memberId }),
    });
    if (res.ok) router.push("/home");
    else setBusy(false);
  }

  async function createNew() {
    if (!name.trim()) return;
    setBusy(true);
    const res = await fetch("/api/room/members", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name.trim(), emoji }),
    });
    if (res.ok) router.push("/home");
    else setBusy(false);
  }

  if (!members) {
    return <p className="text-center text-muted pt-16">Loading…</p>;
  }

  if (creating) {
    return (
      <div className="flex flex-col gap-5 pt-10">
        <div>
          <p className="text-sm text-muted">New to the room</p>
          <h1 className="font-display text-3xl leading-none mt-1">Who are you?</h1>
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          autoFocus
          className="bg-surface border border-border rounded-xl px-4 py-3 text-lg"
        />
        <StickerPicker value={emoji} onChange={setEmoji} />
        <button
          onClick={createNew}
          disabled={!name.trim() || busy}
          className="rounded-full bg-accent text-accent-foreground font-medium py-4 disabled:opacity-40 cursor-pointer"
        >
          {busy ? "Joining…" : "Join the room"}
        </button>
        <button onClick={() => setCreating(false)} className="text-sm text-muted cursor-pointer">
          ← back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pt-10">
      <div>
        <p className="text-sm text-muted">You&apos;re in</p>
        <h1 className="font-display text-3xl leading-none mt-1">Who are you?</h1>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {members.map((m) => (
          <button
            key={m.id}
            onClick={() => claim(m.id)}
            disabled={busy}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-4 cursor-pointer disabled:opacity-50"
          >
            <MemberAvatar emoji={m.emoji} color={m.color} size={48} />
            <span className="text-sm font-medium truncate w-full text-center">{m.name}</span>
          </button>
        ))}
        <button
          onClick={() => setCreating(true)}
          disabled={busy}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-4 cursor-pointer text-muted disabled:opacity-50"
        >
          <span className="text-2xl">+</span>
          <span className="text-sm">New person</span>
        </button>
      </div>
    </div>
  );
}
