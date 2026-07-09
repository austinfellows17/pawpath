"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

function LoginForm() {
  const searchParams = useSearchParams();
  const suspended = searchParams.get("error") === "AccountSuspended";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    suspended ? "This account has been suspended. Contact support if you need help." : ""
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
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

      <GoogleSignInButton callbackUrl="/dashboard" role="OWNER" />

      <p className="mt-3 text-center text-xs text-sand-500">
        New here? Continuing with Google creates a dog owner account and
        agrees to our{" "}
        <Link href="/legal/terms" className="text-trail-700 underline">
          Terms
        </Link>
        .
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
