import Link from "next/link";
import { MemberAvatar } from "@/components/MemberAvatar";
import type { LeaderboardRowData } from "@/components/Leaderboard";

export function YouStatCard({ self }: { self: LeaderboardRowData }) {
  return (
    <Link
      href={`/profile/${self.memberId}`}
      className="rounded-2xl p-4 flex items-center gap-4"
      style={{
        background: `color-mix(in srgb, ${self.color} 16%, var(--surface))`,
        border: `1px solid color-mix(in srgb, ${self.color} 40%, var(--border))`,
      }}
    >
      <MemberAvatar emoji={self.emoji} color={self.color} size={44} ring />
      <div className="flex-1 grid grid-cols-3 gap-2 text-center">
        <Stat label="Steps" value={self.steps.toLocaleString()} />
        <Stat label="Streak" value={self.streak > 0 ? `${self.streak}🔥` : "—"} />
        <Stat label="Rank" value={`#${self.rank}`} />
      </div>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-lg leading-none">{value}</p>
      <p className="text-[10px] text-muted mt-1 uppercase tracking-wide">{label}</p>
    </div>
  );
}
