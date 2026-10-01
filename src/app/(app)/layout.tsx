import { redirect } from "next/navigation";
import { getSessionMemberId } from "@/lib/auth";
import { getMemberById } from "@/lib/members";
import { BottomNav } from "@/components/BottomNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const memberId = await getSessionMemberId();
  if (!memberId) redirect("/pair");

  const member = await getMemberById(memberId);
  if (!member) redirect("/pair");

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 safe-top safe-x px-4 pb-4 pt-6 max-w-md mx-auto w-full">{children}</main>
      <BottomNav />
    </div>
  );
}
