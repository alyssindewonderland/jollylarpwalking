"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { GoalRing } from "@/components/GoalRing";
import { DigitPad } from "@/components/DigitPad";
import { Burst } from "@/components/Burst";

const QUICK_ADD = [100, 500, 1000, 2500];
const MAX_DIGITS = 6; // 999,999 steps is already an absurd ceiling for a day

type CelebrationState = {
  message: string;
  sub?: string;
} | null;

export function QuickLogScreen({
  color,
  dailyGoal,
  initialSteps,
}: {
  color: string;
  dailyGoal: number;
  initialSteps: number;
}) {
  const router = useRouter();
  const [day, setDay] = useState<"today" | "yesterday">("today");
  const [digits, setDigits] = useState(initialSteps > 0 ? String(initialSteps) : "");
  const [saving, setSaving] = useState(false);
  const [celebration, setCelebration] = useState<CelebrationState>(null);
  const [burstKey, setBurstKey] = useState(0);

  const value = digits === "" ? 0 : Number(digits);

  function addDigit(d: string) {
    if (celebration) return;
    setDigits((prev) => {
      const next = (prev === "0" ? "" : prev) + d;
      return next.length > MAX_DIGITS ? prev : next;
    });
  }

  function backspace() {
    if (celebration) return;
    setDigits((prev) => prev.slice(0, -1));
  }

  function quickAdd(amount: number) {
    if (celebration) return;
    setDigits((prev) => String(Math.min(999_999, (Number(prev) || 0) + amount)));
  }

  async function submit() {
    if (!digits || saving || celebration) return;
    setSaving(true);
    const res = await fetch("/api/quick-log", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ steps: value, day }),
    });
    setSaving(false);
    if (!res.ok) return;

    const data = await res.json().catch(() => ({}));
    setBurstKey((k) => k + 1);

    let message = "Logged ✓";
    let sub: string | undefined;
    if (data.isPersonalBest) {
      message = "New personal best! 🎉";
    } else if (data.metGoal) {
      message = "Goal crushed 🎯";
    } else {
      message = "Logged ✓";
    }
    if (data.streak > 1) {
      sub = `🔥 ${data.streak}-day streak`;
    }
    setCelebration({ message, sub });

    setTimeout(() => router.push("/home"), 1400);
  }

  return (
    <div className="flex flex-col gap-2 items-center flex-1 min-h-0">
      <header className="self-start">
        <p className="text-xs text-muted">Quick log</p>
        <h1 className="font-display text-xl leading-none mt-0.5">How&apos;d {day} go?</h1>
      </header>

      <div className="flex gap-1 rounded-full bg-surface p-1 border border-border self-start">
        {(["today", "yesterday"] as const).map((d) => (
          <button
            key={d}
            onClick={() => !celebration && setDay(d)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors cursor-pointer ${
              day === d ? "bg-accent text-accent-foreground" : "text-muted"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="relative shrink-0">
        <GoalRing value={value} goal={dailyGoal} color={color} size={144} stroke={8}>
          <span className="font-display text-2xl tabular-nums">{value.toLocaleString()}</span>
          <span className="text-[10px] text-muted mt-0.5">of {dailyGoal.toLocaleString()} goal</span>
        </GoalRing>
        <Burst key={burstKey} color={color} active={burstKey > 0 && !!celebration} />

        {celebration && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full bg-background animate-fade-up">
            <p className="font-display text-lg text-center px-4">{celebration.message}</p>
            {celebration.sub && <p className="text-xs text-muted">{celebration.sub}</p>}
          </div>
        )}
      </div>

      {!celebration && (
        <>
          <div className="flex gap-1.5 flex-wrap justify-center">
            {QUICK_ADD.map((amount) => (
              <button
                key={amount}
                onClick={() => quickAdd(amount)}
                className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs cursor-pointer active:scale-95 transition-transform"
              >
                +{amount.toLocaleString()}
              </button>
            ))}
            {digits !== "" && (
              <button
                onClick={() => setDigits("")}
                className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-muted cursor-pointer active:scale-95 transition-transform"
              >
                Clear
              </button>
            )}
          </div>

          <div className="w-full max-w-[260px] flex-1 min-h-0 flex flex-col justify-center">
            <DigitPad onDigit={addDigit} onBackspace={backspace} />
          </div>

          <button
            onClick={submit}
            disabled={!digits || saving}
            className="w-full max-w-[260px] rounded-full bg-accent text-accent-foreground font-medium py-3 disabled:opacity-40 cursor-pointer active:scale-[0.98] transition-transform shrink-0"
          >
            {saving ? "Saving…" : "Done"}
          </button>
        </>
      )}
    </div>
  );
}
