"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RerunSetupButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function go() {
    setLoading(true);
    const res = await fetch("/api/me/regenerate-token", { method: "POST" });
    const { token } = await res.json();
    router.push(`/onboarding/add-to-home-screen?t=${token}`);
  }

  return (
    <button
      onClick={go}
      disabled={loading}
      className="rounded-2xl border border-border bg-surface p-4 text-center font-medium cursor-pointer disabled:opacity-50"
    >
      {loading ? "Preparing…" : "Re-run setup"}
    </button>
  );
}
