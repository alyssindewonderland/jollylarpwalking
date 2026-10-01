type MilestoneBadge = {
  id: string;
  name: string;
  color: string;
  earned: boolean;
};

export function MilestoneBadgeRow({ badges }: { badges: MilestoneBadge[] }) {
  if (badges.length === 0) return null;
  return (
    <div className="grid grid-cols-3 gap-2">
      {badges.map((b) => (
        <div
          key={b.id}
          className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center ${
            b.earned ? "bg-surface" : "border-border bg-surface opacity-35 grayscale"
          }`}
          style={b.earned ? { borderColor: `color-mix(in srgb, ${b.color} 50%, var(--border))` } : undefined}
        >
          <span className="size-5 rounded-full" style={{ background: b.color }} />
          <span className="text-[11px] text-muted leading-tight">{b.name}</span>
        </div>
      ))}
    </div>
  );
}
