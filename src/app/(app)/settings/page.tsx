import { getSessionMemberId } from "@/lib/auth";
import { getMemberById, ensureNotificationPrefs } from "@/lib/members";
import { NotificationToggles } from "@/components/NotificationToggles";
import { RerunSetupButton } from "@/components/RerunSetupButton";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const memberId = (await getSessionMemberId())!;
  const [member, prefs] = await Promise.all([getMemberById(memberId), ensureNotificationPrefs(memberId)]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-sm text-muted">Settings</p>
        <h1 className="font-display text-3xl leading-none mt-1">{member?.name}</h1>
      </header>

      <NotificationToggles
        initial={{
          overtakes: prefs.overtakes,
          closeRace: prefs.closeRace,
          weekly: prefs.weekly,
          reminders: prefs.reminders,
          reactions: prefs.reactions,
        }}
      />

      <RerunSetupButton />
    </div>
  );
}
