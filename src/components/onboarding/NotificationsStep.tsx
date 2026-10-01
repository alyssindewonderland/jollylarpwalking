"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { enablePush, type PushSetupResult } from "@/lib/push-client";

export function NotificationsStep() {
  const router = useRouter();
  const [result, setResult] = useState<PushSetupResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function enable() {
    setLoading(true);
    const r = await enablePush();
    setResult(r);
    setLoading(false);
  }

  async function continueOn() {
    const res = await fetch("/api/me").then((r) => r.json());
    router.push(res.source === "manual" ? "/onboarding/quick-log-intro" : "/onboarding/shortcut");
  }

  useEffect(() => {
    // `Notification` isn't a declared global during SSR, so guard with typeof (not just `?.`,
    // which only protects against null/undefined values, not an undeclared identifier).
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResult("subscribed");
    }
  }, []);

  return (
    <>
      <div className="flex-1 flex flex-col gap-5 items-center text-center justify-center">
        <div className="text-6xl">🔔</div>
        <p className="text-muted">
          This is the whole point — overtakes, close races, trash talk, and the weekly results all come through here
          instead of the group chat.
        </p>
        {result === "denied" && (
          <p className="text-sm text-danger">
            Notifications are blocked. You can still use Stride, but you&apos;ll miss everything. Check your
            phone&apos;s notification settings for Stride if you change your mind.
          </p>
        )}
        {result === "unsupported" && (
          <p className="text-sm text-danger">
            This browser doesn&apos;t support push here — make sure you opened Stride from the Home Screen icon.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {result !== "subscribed" && (
          <button
            onClick={enable}
            disabled={loading}
            className="rounded-full bg-accent text-accent-foreground font-medium py-4 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Asking…" : "Enable notifications"}
          </button>
        )}
        <button
          onClick={continueOn}
          className="rounded-full border border-border font-medium py-4 cursor-pointer"
        >
          {result === "subscribed" ? "Continue" : "Skip for now"}
        </button>
      </div>
    </>
  );
}
