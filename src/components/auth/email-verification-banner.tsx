"use client";

import { useSession } from "next-auth/react";
import { Mail } from "lucide-react";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";

export function EmailVerificationBanner() {
  const { data: session } = useSession();

  if (!session?.user?.email || session.user.emailVerified) {
    return null;
  }

  return (
    <div className="mb-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <Mail className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
      <div className="flex-1">
        <p className="font-medium text-amber-900">Verify your email</p>
        <p className="mt-1 text-sm text-amber-800">
          We sent a verification link to{" "}
          <span className="font-medium">{session.user.email}</span>. Check your
          inbox to unlock all features.
        </p>
        <div className="mt-3">
          <ResendVerificationForm
            email={session.user.email}
            buttonClassName="w-full sm:w-auto"
          />
        </div>
      </div>
    </div>
  );
}
