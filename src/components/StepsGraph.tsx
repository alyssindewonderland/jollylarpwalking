"use client";

import Link from "next/link";
import { MemberAvatar } from "@/components/MemberAvatar";
import type { LeaderboardRowData } from "@/components/Leaderboard";

export type MilestoneLine = {
  id: string;
  name: string;
  thresholdSteps: number;
  color: string;
};

const CHART_HEIGHT = 200;

export function StepsGraph({
  rows,
  milestones,
}: {
  rows: LeaderboardRowData[];
  milestones: MilestoneLine[];
}) {
  const maxScale =
    Math.max(1, ...rows.map((r) => r.steps), ...milestones.map((m) => m.thresholdSteps)) * 1.15;

  return (
    <div>
      <div className="relative" style={{ height: CHART_HEIGHT }}>
        <div className="absolute inset-0 flex items-end gap-2">
          {rows.map((row) => (
            <div key={row.memberId} className="flex-1 h-full flex flex-col justify-end min-w-0">
              <div
                className="w-full rounded-t-xl transition-[height] duration-500"
                style={{
                  height: Math.max(4, (row.steps / maxScale) * CHART_HEIGHT),
                  background: `color-mix(in srgb, ${row.color} ${row.rank === 1 ? 32 : 20}%, var(--surface))`,
                  borderTop:
                    row.rank === 1
                      ? "2px solid #fbbf24"
                      : `2px solid color-mix(in srgb, ${row.color} 55%, transparent)`,
                }}
              />
            </div>
          ))}
        </div>

        {milestones.map((m) => (
          <div
            key={m.id}
            className="absolute left-0 right-0 z-10 border-t border-dashed flex items-center pointer-events-none"
            style={{ bottom: (m.thresholdSteps / maxScale) * CHART_HEIGHT, borderColor: m.color }}
          >
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full border bg-background -translate-y-1/2"
              style={{ color: m.color, borderColor: m.color }}
            >
              {m.name} · {m.thresholdSteps.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-2">
        {rows.map((row) => (
          <Link
            key={row.memberId}
            href={`/profile/${row.memberId}`}
            className="flex-1 flex flex-col items-center gap-1 min-w-0"
          >
            <div className="relative">
              <MemberAvatar emoji={row.emoji} color={row.color} size={row.rank === 1 ? 46 : 40} ring={row.isSelf} />
              {row.isCrownHolder && (
                <span className="absolute -top-2 -right-1 text-sm animate-crown-pop">👑</span>
              )}
              <span className="absolute -bottom-1 -left-1 size-4 rounded-full bg-surface border border-border text-[9px] flex items-center justify-center text-muted">
                {row.rank}
              </span>
            </div>
            <p className="text-xs font-medium truncate w-full text-center">{row.name}</p>
            <p className="text-[10px] text-muted">{row.steps.toLocaleString()}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
