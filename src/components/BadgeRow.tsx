import type { Badge } from "@/lib/badges";

export function BadgeRow({ badges }: { badges: Badge[] }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {badges.map((b) => (
        <div
          key={b.label}
          className={`flex flex-col items-center gap-1 rounded-2xl border p-3 text-center ${
            b.earned ? "border-accent/40 bg-surface" : "border-border bg-surface opacity-35 grayscale"
          }`}
        >
          <span className="text-2xl">{b.icon}</span>
          <span className="text-[11px] text-muted leading-tight">{b.label}</span>
        </div>
      ))}
    </div>
  );
}
