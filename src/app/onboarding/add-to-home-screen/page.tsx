import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { AddToHomeScreenStep } from "@/components/onboarding/AddToHomeScreenStep";

export default function AddToHomeScreenPage() {
  return (
    <OnboardingShell step={1} title="First, install Stride" subtitle="This takes 10 seconds.">
      <AddToHomeScreenStep />
    </OnboardingShell>
  );
}
