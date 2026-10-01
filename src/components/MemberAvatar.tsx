export function MemberAvatar({
  emoji,
  color,
  size = 44,
  ring = false,
}: {
  emoji: string;
  color: string;
  size?: number;
  ring?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-center rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.5,
        background: `color-mix(in srgb, ${color} 22%, var(--surface-raised))`,
        boxShadow: ring ? `0 0 0 2px ${color}` : undefined,
      }}
    >
      {emoji}
    </div>
  );
}
