"use client";

function buzz() {
  // No-op on iOS Safari (Vibration API was never implemented there) — harmless to try.
  try {
    navigator.vibrate?.(8);
  } catch {
    // ignore
  }
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export function DigitPad({ onDigit, onBackspace }: { onDigit: (d: string) => void; onBackspace: () => void }) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {KEYS.map((key, i) =>
        key === "" ? (
          <div key={i} />
        ) : (
          <button
            key={i}
            onClick={() => {
              buzz();
              if (key === "⌫") onBackspace();
              else onDigit(key);
            }}
            className="font-display text-xl rounded-xl bg-surface border border-border py-2.5 active:scale-95 active:bg-surface-raised transition-transform cursor-pointer select-none"
          >
            {key}
          </button>
        ),
      )}
    </div>
  );
}
