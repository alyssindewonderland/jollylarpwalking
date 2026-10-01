import { redirect } from "next/navigation";
import { getSessionMemberId } from "@/lib/auth";

export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<{ invalid?: string }>;
}) {
  const memberId = await getSessionMemberId();
  if (memberId) redirect("/home");

  const { invalid } = await searchParams;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center gap-4 px-6 safe-top safe-bottom safe-x">
      <h1 className="font-display text-4xl">Stride</h1>
      <p className="text-muted max-w-xs">
        This is a private steps competition. You need a personal invite link to get in — ask whoever&apos;s running
        it.
      </p>
      {invalid && <p className="text-sm text-danger">That invite link isn&apos;t valid anymore.</p>}
    </div>
  );
}
