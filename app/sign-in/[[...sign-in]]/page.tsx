import { SignIn } from "@clerk/nextjs";
import { PulseLogo } from "@/components/ui/pulse-logo";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <PulseLogo />
        </div>

        <SignIn
          fallbackRedirectUrl="/pulse-ai"
          forceRedirectUrl="/pulse-ai"
        />
      </div>
    </main>
  );
}