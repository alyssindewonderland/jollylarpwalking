import Link from "next/link";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";

export default function QuickLogIntroPage() {
  return (
    <OnboardingShell
      step={3}
      title="You're on manual logging"
      subtitle="No Health app on Android, so it's one quick tap a day instead."
    >
      <div className="flex-1 flex flex-col gap-5 items-center text-center justify-center">
        <div className="text-6xl">✍️</div>
        <p className="text-muted">
          We&apos;ll remind you every evening if you haven&apos;t logged yet. It&apos;s one number, takes five
          seconds.
        </p>
      </div>
      <Link href="/quick-log" className="rounded-full bg-accent text-accent-foreground font-medium py-4 text-center">
        Log today&apos;s steps
      </Link>
    </OnboardingShell>
  );
}
