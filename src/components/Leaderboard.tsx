"use client";

import { useState } from "react";
import { StepsGraph, type MilestoneLine } from "@/components/StepsGraph";
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
  milestones,
}: {
  data: Record<Period, LeaderboardRowData[]>;
  milestones: MilestoneLine[];
}) {
  const [period, setPeriod] = useState<Period>("today");
  const rows = data[period];
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

      <StepsGraph rows={rows} milestones={period === "today" ? milestones : []} />

      {self && <YouStatCard self={self} />}
    </div>
  );
}
