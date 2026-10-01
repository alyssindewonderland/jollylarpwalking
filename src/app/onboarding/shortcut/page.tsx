import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { ShortcutSetupStep } from "@/components/onboarding/ShortcutSetupStep";

export default function ShortcutSetupPage() {
  return (
    <OnboardingShell step={3} title="Connect your steps" subtitle="One Shortcut, then you're set for good.">
      <ShortcutSetupStep />
    </OnboardingShell>
  );
}
