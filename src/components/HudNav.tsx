"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/home", label: "Board", icon: "🏆" },
  { href: "/activity", label: "Activity", icon: "💬" },
];

export function HudNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 safe-bottom safe-x px-6 pb-3">
      <div className="flex gap-2 rounded-full border border-border bg-surface/90 backdrop-blur p-1.5 shadow-lg">
        {TABS.map((tab) => {
          const active = pathname?.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-accent text-accent-foreground" : "text-muted"
              }`}
            >
              <span className="text-base leading-none">{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
