"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Milestone = {
  id: string;
  name: string;
  thresholdSteps: number;
  color: string;
  beforeTime: string | null;
};

const PALETTE = ["#22d3ee", "#f97316", "#a855f7", "#22c55e", "#f43f5e", "#eab308", "#60a5fa", "#fb7185"];

export function MilestonesEditor() {
  const router = useRouter();
  const [milestones, setMilestones] = useState<Milestone[] | null>(null);
  const [name, setName] = useState("");
  const [threshold, setThreshold] = useState("10000");
  const [color, setColor] = useState(PALETTE[0]);
  const [timeLimited, setTimeLimited] = useState(false);
  const [beforeTime, setBeforeTime] = useState("12:00");
  const [saving, setSaving] = useState(false);

  function load() {
    fetch("/api/milestones")
      .then((r) => r.json())
      .then((d) => setMilestones(d.milestones ?? []));
  }

  useEffect(load, []);

  async function create() {
    if (!name.trim() || !threshold) return;
    setSaving(true);
    const res = await fetch("/api/milestones", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        thresholdSteps: Number(threshold),
        color,
        beforeTime: timeLimited ? beforeTime : null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setName("");
      setThreshold("10000");
      setTimeLimited(false);
      load();
      router.refresh();
    }
  }

  async function remove(id: string) {
    setMilestones((prev) => prev?.filter((m) => m.id !== id) ?? null);
    await fetch(`/api/milestones/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs uppercase tracking-wide text-muted">Milestones</h3>
      <p className="text-xs text-muted -mt-1">
        Shown as dotted lines on today&apos;s graph and awarded as badges once crossed. A time
        limit checks when a day&apos;s number was last saved, not when the steps actually
        happened — a single evening lump-sum entry won&apos;t satisfy a &quot;before noon&quot;
        milestone even if it was technically true.
      </p>

      {milestones && milestones.length > 0 && (
        <div className="flex flex-col gap-2">
          {milestones.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5"
            >
              <span className="size-3 rounded-full shrink-0" style={{ background: m.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.name}</p>
                <p className="text-xs text-muted">
                  {m.thresholdSteps.toLocaleString()} steps{m.beforeTime ? ` · before ${m.beforeTime}` : ""}
                </p>
              </div>
              <button
                onClick={() => remove(m.id)}
                className="text-xs text-muted cursor-pointer px-2 py-1"
                aria-label={`Remove ${m.name}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface p-3 flex flex-col gap-2.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. 10k Club"
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm"
        />
        <input
          type="number"
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          placeholder="Threshold steps"
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm"
        />
        <div className="flex gap-1.5">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="size-6 rounded-full cursor-pointer"
              style={{ background: c, outline: color === c ? "2px solid var(--foreground)" : undefined }}
            />
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={timeLimited} onChange={(e) => setTimeLimited(e.target.checked)} />
          Time-limited (e.g. 5k before noon)
        </label>
        {timeLimited && (
          <input
            type="time"
            value={beforeTime}
            onChange={(e) => setBeforeTime(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm self-start"
          />
        )}
        <button
          onClick={create}
          disabled={!name.trim() || saving}
          className="self-start rounded-full bg-accent text-accent-foreground text-sm font-medium px-4 py-2 cursor-pointer disabled:opacity-40"
        >
          {saving ? "Adding…" : "Add milestone"}
        </button>
      </div>
    </section>
  );
}
