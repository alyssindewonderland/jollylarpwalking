import Link from "next/link";
import { db } from "@/db";
import { members } from "@/db/schema";
import { DevNotificationSender } from "@/components/DevNotificationSender";

export const dynamic = "force-dynamic";

export default async function DevPage() {
  const allMembers = await db.select().from(members);

  return (
    <div className="min-h-screen safe-top safe-bottom safe-x px-4 py-8 max-w-xl mx-auto w-full flex flex-col gap-6">
      <h1 className="font-display text-3xl">Dev preview</h1>
      <p className="text-sm text-muted">
        Fires a real push to the selected member&apos;s subscribed devices so you can see exactly what lands. Also
        useful
        for sanity-checking copy variety.
      </p>
      <DevNotificationSender members={allMembers.map((m) => ({ id: m.id, name: m.name, emoji: m.emoji }))} />
      <Link href="/weekly" className="rounded-2xl border border-border bg-surface p-4 text-center font-medium">
        Preview weekly recap screen →
      </Link>
    </div>
  );
}
