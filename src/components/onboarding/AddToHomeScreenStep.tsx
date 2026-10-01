"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isIOS, isStandalone } from "@/lib/push-client";

export function AddToHomeScreenStep() {
  const [ios, setIos] = useState(true);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    // Deliberately deferred to an effect (not a lazy useState initializer): isIOS/isStandalone
    // read browser-only globals, so computing them during SSR would cause a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIos(isIOS());
    setStandalone(isStandalone());
  }, []);

  return (
    <>
      <div className="flex-1 flex flex-col gap-5">
        {standalone ? (
          <div className="rounded-2xl border border-accent/40 bg-surface p-4 text-sm">
            You&apos;re already running the installed app — nice. Continue to the next step.
          </div>
        ) : ios ? (
          <ol className="flex flex-col gap-4 text-sm">
            <Step n={1} text="Tap the Share icon in Safari's toolbar" icon="⬆️" />
            <Step n={2} text='Scroll down and tap "Add to Home Screen"' icon="➕" />
            <Step n={3} text='Tap "Add" in the top right' icon="✅" />
            <Step n={4} text="Then tap the new Stride icon on your Home Screen" icon="🏠" />
          </ol>
        ) : (
          <ol className="flex flex-col gap-4 text-sm">
            <Step n={1} text="Open your browser menu" icon="⋮" />
            <Step n={2} text='Tap "Add to Home screen" / "Install app"' icon="➕" />
            <Step n={3} text="Then tap the new Stride icon on your Home Screen" icon="🏠" />
          </ol>
        )}
        <p className="text-xs text-muted">
          This matters: push notifications only work once Stride is installed like a real app, not in a browser tab.
        </p>
      </div>
      <Link href="/pair" className="rounded-full bg-accent text-accent-foreground font-medium py-4 text-center">
        I&apos;ve added it — continue
      </Link>
    </>
  );
}

function Step({ n, text, icon }: { n: number; text: string; icon: string }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
      <span className="text-xl w-7 text-center">{icon}</span>
      <span className="flex-1">{text}</span>
      <span className="text-muted text-xs">{n}</span>
    </li>
  );
}
