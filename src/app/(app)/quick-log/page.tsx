"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function QuickLogPage() {
  const router = useRouter();
  const [day, setDay] = useState<"today" | "yesterday">("today");
  const [steps, setSteps] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    const value = Number(steps);
    if (!Number.isFinite(value) || value < 0) return;
    setSaving(true);
    const res = await fetch("/api/quick-log", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ steps: value, day }),
    });
    setSaving(false);
    if (res.ok) {
      setDone(true);
      setTimeout(() => router.push("/home"), 700);
    }
  }

  return (
    <div className="flex flex-col gap-8 pt-6">
      <header>
        <p className="text-sm text-muted">Quick log</p>
        <h1 className="font-display text-3xl leading-none mt-1">How many steps?</h1>
      </header>

      <div className="flex gap-1 rounded-full bg-surface p-1 border border-border self-start">
        {(["today", "yesterday"] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDay(d)}
            className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors cursor-pointer ${
              day === d ? "bg-accent text-accent-foreground" : "text-muted"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <input
        inputMode="numeric"
        pattern="[0-9]*"
        value={steps}
        onChange={(e) => setSteps(e.target.value.replace(/\D/g, ""))}
        placeholder="0"
        autoFocus
        className="font-display text-6xl bg-transparent outline-none w-full text-center"
      />
      <p className="text-xs text-muted text-center -mt-4">✍️ manual</p>

      <button
        onClick={submit}
        disabled={!steps || saving}
        className="rounded-full bg-accent text-accent-foreground font-medium py-4 disabled:opacity-40 cursor-pointer"
      >
        {done ? "Logged ✓" : saving ? "Saving…" : "Done"}
      </button>
    </div>
  );
}
