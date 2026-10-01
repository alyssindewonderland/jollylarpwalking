import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { NotificationsStep } from "@/components/onboarding/NotificationsStep";

export default function NotificationsPage() {
  return (
    <OnboardingShell step={2} title="Turn on notifications">
      <NotificationsStep />
    </OnboardingShell>
  );
}
