"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";

function LoginForm() {
  const searchParams = useSearchParams();
  const suspended = searchParams.get("error") === "AccountSuspended";
  const emailNotVerified = searchParams.get("error") === "EmailNotVerified";
  const justVerified = searchParams.get("verified") === "1";
  const emailFromQuery = searchParams.get("email") ?? "";
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState(emailFromQuery);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    suspended
      ? "This account has been suspended. Contact support if you need help."
      : ""
  );
  const [needsVerification, setNeedsVerification] = useState(emailNotVerified);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (emailFromQuery) {
      setEmail(emailFromQuery);
    }
    if (emailNotVerified) {
      setNeedsVerification(true);
      setError("");
    }
  }, [emailFromQuery, emailNotVerified]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNeedsVerification(false);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.url) {
      const next = new URL(result.url, window.location.origin);
      if (next.searchParams.get("error") === "EmailNotVerified") {
        setNeedsVerification(true);
        setLoading(false);
        return;
      }

      if (next.pathname !== "/login") {
        window.location.href = result.url;
        return;
      }
    }

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    window.location.href = callbackUrl.startsWith("/") ? callbackUrl : "/dashboard";
  }

  return (
    <div className="hero-band min-h-[calc(100vh-4rem)] border-b border-sand-200/50">
      <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16 sm:px-6 sm:py-20">
        <div className="glass rounded-3xl p-8 sm:p-10">
          <p className="section-label">Welcome back</p>
          <h1 className="headline-lg mt-2">Sign in</h1>
          <p className="mt-3 text-sand-600">
            Log in to message walkers or manage your listing.
          </p>

          {justVerified && (
            <div className="mt-6 flex gap-3 rounded-2xl border border-trail-200 bg-trail-50 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-trail-700" />
              <p className="text-sm text-trail-800">
                Email verified successfully. Sign in to continue.
              </p>
            </div>
          )}

          {needsVerification && (
            <div className="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div className="flex-1">
                <p className="font-medium text-amber-900">Verify your email first</p>
                <p className="mt-1 text-sm text-amber-800">
                  We sent a verification link to your inbox. Click the link in
                  that email, then sign in here. Check spam if you don&apos;t see it.
                </p>
                <div className="mt-3">
                  <ResendVerificationForm email={email} onEmailChange={setEmail} />
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-trail-800">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-sand-300 px-4 py-2.5 focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-trail-800"
              >
                Password
              </label>
              <div className="mt-1 flex items-center justify-between gap-2">
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-sand-300 px-4 py-2.5 focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
                />
              </div>
              <p className="mt-2 text-right text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-trail-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-sand-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-sand-50 px-3 text-sand-500">or</span>
            </div>
          </div>

          <GoogleSignInButton callbackUrl={callbackUrl} role="OWNER" />

          <p className="mt-3 text-center text-xs text-sand-500">
            Google sign-in skips email verification — your Google email is
            trusted automatically.
          </p>

          <p className="mt-6 text-center text-sm text-sand-600">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-trail-700 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="hero-band min-h-[calc(100vh-4rem)]" />}>
      <LoginForm />
    </Suspense>
  );
}
