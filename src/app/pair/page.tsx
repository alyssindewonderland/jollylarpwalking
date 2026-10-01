import { getSessionMemberId } from "@/lib/auth";
import { PairDisplay } from "@/components/onboarding/PairDisplay";
import { PairRedeemForm } from "@/components/onboarding/PairRedeemForm";

export const dynamic = "force-dynamic";

export default async function PairPage() {
  const memberId = await getSessionMemberId();

  return (
    <div className="flex flex-col min-h-screen safe-top safe-bottom safe-x px-6 py-8 max-w-md mx-auto w-full">
      <h1 className="font-display text-3xl text-center">
        {memberId ? "One more step" : "Welcome back 👋"}
      </h1>
      {memberId ? <PairDisplay /> : <PairRedeemForm />}
    </div>
  );
}
