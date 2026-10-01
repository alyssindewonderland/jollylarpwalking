"use client";

export function GoalRing({
  value,
  goal,
  color,
  size = 280,
  stroke = 14,
  children,
}: {
  value: number;
  goal: number;
  color: string;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(1, goal > 0 ? value / goal : 0);
  const offset = circumference * (1 - pct);
  const over = value >= goal && goal > 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 400ms cubic-bezier(0.22, 1, 0.36, 1)",
            filter: over ? `drop-shadow(0 0 10px color-mix(in srgb, ${color} 70%, transparent))` : undefined,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
