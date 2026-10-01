"use client";

import { useEffect, useState } from "react";

export function PairDisplay() {
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/pair/create", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.code) setCode(data.code);
        else setError(true);
      })
      .catch(() => setError(true));
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 text-center pt-10">
      <p className="text-muted">Open Stride from your Home Screen, then enter this code:</p>
      <div className="font-display text-7xl tracking-widest">
        {error ? "—" : code ?? "••••••"}
      </div>
      <p className="text-xs text-muted">Expires in 10 minutes. You can come back here for a new one.</p>
    </div>
  );
}
