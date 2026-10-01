"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLogin() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState(false);

  async function submit() {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret }),
    });
    if (res.ok) router.refresh();
    else setError(true);
  }

  return (
    <div className="flex flex-col gap-4 max-w-sm mx-auto pt-20">
      <h1 className="font-display text-3xl text-center">Admin</h1>
      <input
        type="password"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Admin passphrase"
        className="bg-surface border border-border rounded-xl px-4 py-3 text-center"
      />
      {error && <p className="text-sm text-danger text-center">Wrong passphrase.</p>}
      <button onClick={submit} className="rounded-xl bg-accent text-accent-foreground font-medium py-3 cursor-pointer">
        Enter
      </button>
    </div>
  );
}
