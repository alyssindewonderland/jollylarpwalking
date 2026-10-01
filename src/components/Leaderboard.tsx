"use client";

import { useState } from "react";
import Link from "next/link";
import { MemberAvatar } from "@/components/MemberAvatar";
import { CountUp } from "@/components/CountUp";
import { Podium } from "@/components/Podium";
import { YouStatCard } from "@/components/YouStatCard";
import type { Period } from "@/lib/leaderboard";

export type LeaderboardRowData = {
  memberId: string;
  name: string;
  emoji: string;
  color: string;
  steps: number;
  rank: number;
  gapToLeader: number;
  isCrownHolder: boolean;
  isSelf: boolean;
  streak: number;
};

const TABS: { key: Period; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

export function Leaderboard({
  data,
}: {
  data: Record<Period, LeaderboardRowData[]>;
}) {
  const [period, setPeriod] = useState<Period>("today");
  const rows = data[period];
  const top = rows.slice(0, 3);
  const rest = rows.slice(3);
  const self = rows.find((r) => r.isSelf);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 rounded-full bg-surface p-1 border border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setPeriod(tab.key)}
            className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors cursor-pointer ${
              period === tab.key ? "bg-accent text-accent-foreground" : "text-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Podium top={top} />

      {self && self.rank > 3 && <YouStatCard self={self} />}

      {rest.length > 0 && (
        <div className="flex flex-col gap-2">
          {rest.map((row) => (
            <Link
              key={row.memberId}
              href={`/profile/${row.memberId}`}
              className={`flex items-center gap-3 rounded-2xl border px-3 py-3 animate-rank-shuffle transition-transform active:scale-[0.98] ${
                row.isSelf ? "border-accent/60 bg-surface-raised" : "border-border bg-surface"
              }`}
            >
              <div className="font-display text-2xl w-6 text-center text-muted">{row.rank}</div>
              <div className="relative">
                <MemberAvatar emoji={row.emoji} color={row.color} />
                {row.isCrownHolder && (
                  <span className="absolute -top-2 -right-1 text-base animate-crown-pop">👑</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{row.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted">−{row.gapToLeader.toLocaleString()} to #1</p>
                  {row.streak > 0 && <p className="text-xs text-orange-400">🔥{row.streak}</p>}
                </div>
              </div>
              <CountUp value={row.steps} className="font-display text-xl" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
