"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token && email ? "loading" : "error"
  );
  const [message, setMessage] = useState(
    token && email ? "" : "This verification link is invalid."
  );

  useEffect(() => {
    if (!token || !email) return;

    void fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token }),
    }).then(async (response) => {
      const data = await response.json();
      if (response.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Unable to verify email");
      }
    });
  }, [email, token]);

  if (status === "loading") {
    return <p className="text-sm text-sand-600">Verifying your email...</p>;
  }

  if (status === "success") {
    const loginHref = `/login?verified=1&email=${encodeURIComponent(email)}`;

    return (
      <div className="space-y-4">
        <div className="flex gap-3 rounded-2xl border border-trail-200 bg-trail-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-trail-700" />
          <p className="text-sm text-trail-800">
            Your email is verified. Sign in to continue setting up your account.
          </p>
        </div>
        <Button href={loginHref} className="w-full">
          Continue to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-red-600">{message}</p>
      {email && (
        <div className="rounded-2xl border border-sand-200 bg-sand-50 p-4">
          <p className="text-sm text-sand-700">
            Need a new link? We can send another email to{" "}
            <span className="font-medium text-trail-900">{email}</span>.
          </p>
          <div className="mt-3">
            <ResendVerificationForm email={email} />
          </div>
        </div>
      )}
      <Button href="/login" variant="outline" className="w-full">
        Back to sign in
      </Button>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="hero-band min-h-[calc(100vh-4rem)] border-b border-sand-200/50">
      <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16 sm:px-6 sm:py-20">
        <div className="glass rounded-3xl p-8 sm:p-10">
          <p className="section-label">Account</p>
          <h1 className="headline-lg mt-2">Verify email</h1>
          <div className="mt-8">
            <Suspense fallback={<p className="text-sm text-sand-600">Loading...</p>}>
              <VerifyEmailContent />
            </Suspense>
          </div>
          <p className="mt-6 text-center text-sm text-sand-600">
            <Link href="/login" className="font-medium text-trail-700 hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
