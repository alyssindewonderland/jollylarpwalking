"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RoomPinEntry() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(value: string) {
    setLoading(true);
    setError(false);
    const res = await fetch("/api/room/enter", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pin: value }),
    });
    setLoading(false);
    if (res.ok) router.push("/who");
    else setError(true);
  }

  function onDigit(d: string) {
    if (loading) return;
    const next = (pin + d).slice(0, 4);
    setPin(next);
    setError(false);
    if (next.length === 4) submit(next);
  }

  return (
    <div className="flex flex-col items-center gap-8 pt-16 text-center">
      <div>
        <h1 className="font-display text-4xl">Stride</h1>
        <p className="text-muted mt-2">Enter the room PIN</p>
      </div>

      <div className="flex gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`size-4 rounded-full border ${
              i < pin.length ? "bg-accent border-accent" : "border-border"
            } ${error ? "border-danger" : ""}`}
          />
        ))}
      </div>

      {error && <p className="text-sm text-danger -mt-4">Wrong PIN — try again</p>}

      <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((key, i) =>
          key === "" ? (
            <div key={i} />
          ) : (
            <button
              key={i}
              onClick={() => (key === "⌫" ? setPin((p) => p.slice(0, -1)) : onDigit(key))}
              className="font-display text-2xl rounded-2xl bg-surface border border-border py-4 active:scale-95 transition-transform cursor-pointer select-none"
            >
              {key}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
