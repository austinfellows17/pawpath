"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    setMessage(data.message);
    setLoading(false);
  }

  return (
    <div className="hero-band min-h-[calc(100vh-4rem)] border-b border-sand-200/50">
      <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16 sm:px-6 sm:py-20">
        <div className="glass rounded-3xl p-8 sm:p-10">
          <p className="section-label">Account</p>
          <h1 className="headline-lg mt-2">Forgot password</h1>
          <p className="mt-3 text-sand-600">
            Enter your email and we&apos;ll send reset instructions if an account
            exists.
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

            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-trail-700">{message}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
            </Button>
          </form>

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
