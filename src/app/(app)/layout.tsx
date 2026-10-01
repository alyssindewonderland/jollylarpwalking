import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionMemberId } from "@/lib/auth";
import { getMemberById } from "@/lib/members";
import { RoomHeader } from "@/components/RoomSheet";
import { HudNav } from "@/components/HudNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const memberId = await getSessionMemberId();
  if (!memberId) redirect("/enter");

  const member = await getMemberById(memberId);
  if (!member) redirect("/enter");

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between safe-top safe-x px-4 pt-4 max-w-md mx-auto w-full">
        <Link href="/home" className="font-display text-xl">
          Stride
        </Link>
        <RoomHeader
          initialMember={{ id: member.id, name: member.name, emoji: member.emoji, color: member.color }}
        />
      </header>
      <main className="flex-1 safe-x px-4 pb-4 pt-4 max-w-md mx-auto w-full">{children}</main>
      <HudNav />
    </div>
  );
}
