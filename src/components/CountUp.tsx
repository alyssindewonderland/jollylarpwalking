"use client";

import { useEffect, useRef, useState } from "react";

export function CountUp({ value, durationMs = 700, className }: { value: number; durationMs?: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    const from = prevValue.current;
    const to = value;
    if (from === to) return;

    const start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else prevValue.current = to;
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  return <span className={className}>{display.toLocaleString()}</span>;
}
