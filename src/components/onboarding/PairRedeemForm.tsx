"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PairRedeemForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/pair/redeem", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/onboarding/notifications");
    } else {
      setError("That code didn't work — check it or grab a new one in Safari.");
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center pt-10">
      <p className="text-muted">Enter the code shown in Safari:</p>
      <input
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        autoFocus
        className="font-display text-6xl tracking-widest bg-transparent outline-none text-center w-full"
        placeholder="______"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        onClick={submit}
        disabled={code.length !== 6 || loading}
        className="w-full rounded-full bg-accent text-accent-foreground font-medium py-4 disabled:opacity-40 cursor-pointer"
      >
        {loading ? "Checking…" : "Continue"}
      </button>
    </div>
  );
}
