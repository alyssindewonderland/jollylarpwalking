import { redirect } from "next/navigation";
import { getSessionMemberId } from "@/lib/auth";
import { hasRoomAccess } from "@/lib/room";

export default async function RootPage() {
  if (await getSessionMemberId()) redirect("/home");
  if (await hasRoomAccess()) redirect("/who");
  redirect("/enter");
}
