"use client";

const PARTICLE_COUNT = 14;

// Deterministic per-index spread so re-renders don't reshuffle particles mid-animation.
function particleStyle(i: number, color: string): React.CSSProperties {
  const angle = (i / PARTICLE_COUNT) * 360 + (i % 2 === 0 ? 8 : -8);
  const distance = 70 + ((i * 37) % 50);
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * distance;
  const y = Math.sin(rad) * distance;
  const delay = (i % 5) * 15;
  return {
    "--dx": `${x}px`,
    "--dy": `${y}px`,
    animationDelay: `${delay}ms`,
    background: color,
  } as React.CSSProperties;
}

export function Burst({ color, active }: { color: string; active: boolean }) {
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <span key={i} className="burst-particle" style={particleStyle(i, color)} />
      ))}
      <style jsx>{`
        .burst-particle {
          position: absolute;
          width: 7px;
          height: 7px;
          border-radius: 999px;
          opacity: 1;
          animation: burst-fly 650ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes burst-fly {
          to {
            transform: translate(var(--dx), var(--dy)) scale(0.4);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
