import Link from "next/link";
import { MemberAvatar } from "@/components/MemberAvatar";
import type { LeaderboardRowData } from "@/components/Leaderboard";

// Tier heights are fixed by rank position, not proportional to the step count gap between
// them — a 20-step lead over #2 shouldn't make the bars look nearly identical, and a blowout
// lead shouldn't make #2's bar vanish. Matches the reference's "ladder", not a bar chart.
const TIER_HEIGHTS = [84, 112, 144]; // shortest (3rd) -> tallest (1st)

export function Podium({ top }: { top: LeaderboardRowData[] }) {
  if (top.length === 0) return null;

  // top is rank-ascending (1st, 2nd, 3rd); display left-to-right as 3rd, 2nd, 1st.
  const ordered = [...top].reverse();
  const heights = TIER_HEIGHTS.slice(TIER_HEIGHTS.length - ordered.length);

  return (
    <div className="flex items-end gap-2">
      {ordered.map((row, i) => (
        <Link
          key={row.memberId}
          href={`/profile/${row.memberId}`}
          className="flex-1 flex flex-col items-center gap-2 min-w-0"
        >
          <div className="relative">
            <MemberAvatar emoji={row.emoji} color={row.color} size={row.rank === 1 ? 60 : 50} ring />
            {row.isCrownHolder && (
              <span className="absolute -top-2 -right-1 text-base animate-crown-pop">👑</span>
            )}
          </div>
          <div className="text-center min-w-0 w-full">
            <p className="text-sm font-medium truncate">{row.name}</p>
            <p className="text-xs text-muted">{row.steps.toLocaleString()}</p>
          </div>
          <div
            className={`w-full rounded-t-2xl flex items-start justify-center pt-2 ${
              row.rank === 1 ? "animate-glow-pulse" : ""
            }`}
            style={{
              height: heights[i],
              background: `color-mix(in srgb, ${row.color} ${row.rank === 1 ? 30 : 18}%, var(--surface))`,
              borderTop: `2px solid ${row.rank === 1 ? "#fbbf24" : `color-mix(in srgb, ${row.color} 60%, transparent)`}`,
              ["--member-color" as string]: row.color,
            }}
          >
            <span className={`font-display text-2xl ${row.rank === 1 ? "text-amber-400" : "text-muted"}`}>
              {row.rank}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
