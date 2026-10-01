export function StepsChart({
  data,
  color,
  goal,
}: {
  data: { date: string; steps: number }[];
  color: string;
  goal: number;
}) {
  const max = Math.max(goal, ...data.map((d) => d.steps), 1);
  const width = 320;
  const height = 120;
  const barGap = 2;
  const barWidth = width / data.length - barGap;
  const goalY = height - (goal / max) * height;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      <line
        x1={0}
        x2={width}
        y1={goalY}
        y2={goalY}
        stroke="var(--muted)"
        strokeDasharray="3 3"
        strokeWidth={1}
      />
      {data.map((d, i) => {
        const barHeight = Math.max(2, (d.steps / max) * height);
        return (
          <rect
            key={d.date}
            x={i * (barWidth + barGap)}
            y={height - barHeight}
            width={barWidth}
            height={barHeight}
            rx={2}
            fill={d.steps >= goal ? color : "color-mix(in srgb, " + color + " 35%, transparent)"}
          />
        );
      })}
    </svg>
  );
}
