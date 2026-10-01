"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TOKEN_CACHE_KEY = "stride_setup_token";

export function ShortcutSetupStep() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState<"token" | "url" | null>(null);
  const [synced, setSynced] = useState(false);
  const [todaySteps, setTodaySteps] = useState<number | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    // window/sessionStorage only exist client-side, so this has to run post-mount, not during
    // a lazy useState initializer (which would run during SSR too and crash).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
    const cached = sessionStorage.getItem(TOKEN_CACHE_KEY);
    if (cached) {
      setToken(cached);
      return;
    }
    fetch("/api/me/regenerate-token", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.token) {
          setToken(data.token);
          sessionStorage.setItem(TOKEN_CACHE_KEY, data.token);
        }
      });
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/me").then((r) => r.json());
      if (res.lastSyncedAt) {
        const age = Date.now() - new Date(res.lastSyncedAt).getTime();
        if (age < 24 * 60 * 60 * 1000) {
          setSynced(true);
          const home = await fetch("/api/me/today-steps").then((r) => (r.ok ? r.json() : null));
          if (home) setTodaySteps(home.steps);
        }
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  function copy(text: string, which: "token" | "url") {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  const endpointUrl = `${origin}/api/steps`;

  return (
    <>
      <div className="flex-1 flex flex-col gap-5">
        <div
          className={`rounded-2xl border p-4 text-sm ${
            synced ? "border-accent/50 bg-surface" : "border-border bg-surface"
          }`}
        >
          {synced ? (
            <p>
              ✅ Synced! {todaySteps !== null ? `${todaySteps.toLocaleString()} steps today.` : "You're good to go."}
            </p>
          ) : (
            <p className="text-muted">⏳ Waiting for first sync… this updates automatically once the Shortcut runs.</p>
          )}
        </div>

        <Field label="Your token" value={token ?? "…"} onCopy={() => token && copy(token, "token")} copied={copied === "token"} />
        <Field label="Endpoint URL" value={endpointUrl} onCopy={() => copy(endpointUrl, "url")} copied={copied === "url"} />

        <div className="flex flex-col gap-3 text-sm">
          <p className="font-medium">Build the Shortcut (one time):</p>
          <ol className="flex flex-col gap-3">
            <SetupItem n={1} text="In the Shortcuts app, create a new shortcut named “Sync Steps”." />
            <SetupItem n={2} text='Add "Find Health Samples" → Steps → Last 7 Days → grouped by Day.' />
            <SetupItem n={3} text="Build a JSON body like {days:[{date, steps}, ...]} from those samples." />
            <SetupItem
              n={4}
              text={
                <>
                  Add &quot;Get Contents of URL&quot;: POST to <code className="text-xs">{endpointUrl}</code>,
                  header{" "}
                  <code className="text-xs">Authorization: Bearer</code> + your token above.
                </>
              }
            />
            <SetupItem n={5} text="Automation tab → + → App → Instagram → Is Opened → choose this shortcut." />
            <SetupItem n={6} text='Turn OFF "Ask Before Running" and OFF "Notify When Run" to keep it silent.' />
          </ol>
          <p className="text-xs text-muted">
            Full instructions with screenshots are in the chat where you set this up with Claude.
          </p>
        </div>
      </div>

      <button
        onClick={() => router.push("/home")}
        className="rounded-full bg-accent text-accent-foreground font-medium py-4 cursor-pointer"
      >
        Done
      </button>
    </>
  );
}

function Field({ label, value, onCopy, copied }: { label: string; value: string; onCopy: () => void; copied: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3">
      <p className="text-xs text-muted mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <code className="text-xs flex-1 truncate">{value}</code>
        <button
          onClick={onCopy}
          className="text-xs rounded-full bg-background border border-border px-3 py-1.5 shrink-0 cursor-pointer"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function SetupItem({ n, text }: { n: number; text: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="font-display text-lg text-muted w-5 shrink-0">{n}</span>
      <span>{text}</span>
    </li>
  );
}
