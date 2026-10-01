"use client";

import { STICKERS } from "@/lib/stickers";

export function StickerPicker({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {STICKERS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={`text-2xl rounded-xl py-2 cursor-pointer transition-colors ${
            value === s ? "bg-accent/20 ring-2 ring-accent" : "bg-surface border border-border"
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
