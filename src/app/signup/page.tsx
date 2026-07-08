"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { DisclaimerBanner } from "@/components/legal/disclaimer-banner";
import { LIABILITY_DISCLAIMER } from "@/lib/constants";

function SignupForm() {
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") === "walker" ? "WALKER" : "OWNER";

  const [role, setRole] = useState<"OWNER" | "WALKER">(defaultRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!termsAccepted) {
      setError("You must accept the Terms of Service and Liability Disclaimer");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Account created but sign-in failed. Try logging in.");
      setLoading(false);
      return;
    }

    window.location.href = "/onboarding";
  }

  return (
    <div className="hero-band min-h-[calc(100vh-4rem)] border-b border-sand-200/50">
      <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16 sm:px-6 sm:py-20">
        <div className="glass rounded-3xl p-8 sm:p-10">
          <p className="section-label">Get started</p>
          <h1 className="headline-lg mt-2">Join PawPath</h1>
          <p className="mt-3 text-sand-600">
            {role === "WALKER"
              ? "Create your walker listing."
              : "Find trusted local walkers near your dog."}
          </p>

          <div className="mt-6 flex rounded-xl border border-sand-200/80 bg-sand-100/80 p-1">
        <button
          type="button"
          onClick={() => setRole("OWNER")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            role === "OWNER"
              ? "bg-white text-trail-900 shadow-sm"
              : "text-sand-600"
          }`}
        >
          I&apos;m a dog owner
        </button>
        <button
          type="button"
          onClick={() => setRole("WALKER")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            role === "WALKER"
              ? "bg-white text-trail-900 shadow-sm"
              : "text-sand-600"
          }`}
        >
          I&apos;m a walker
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="name" className="text-sm font-medium text-trail-800">
            Full name
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-sand-300 px-4 py-2.5 focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
          />
        </div>
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
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-sand-300 px-4 py-2.5 focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
          />
        </div>

        <label className="flex items-start gap-3 text-sm text-sand-700">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 rounded border-sand-300 text-trail-600 focus:ring-trail-500"
          />
          <span>
            I agree to the{" "}
            <Link href="/legal/terms" className="text-trail-700 underline">
              Terms of Service
            </Link>
            ,{" "}
            <Link href="/legal/disclaimer" className="text-trail-700 underline">
              Liability Disclaimer
            </Link>
            , and understand PawPath does not employ walkers or process payments.
          </span>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
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

      <GoogleSignInButton
        callbackUrl="/dashboard"
        role={role}
        requireTerms
        termsAccepted={termsAccepted}
        onTermsError={() =>
          setError("You must accept the Terms of Service and Liability Disclaimer")
        }
      />

      <div className="mt-8">
        <DisclaimerBanner compact>{LIABILITY_DISCLAIMER}</DisclaimerBanner>
      </div>

      <p className="mt-6 text-center text-sm text-sand-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-trail-700 hover:underline">
          Log in
        </Link>
      </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
