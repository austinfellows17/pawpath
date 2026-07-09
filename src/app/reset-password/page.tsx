"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Unable to reset password");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (!token || !email) {
    return (
      <p className="text-sm text-red-600">
        This reset link is invalid.{" "}
        <Link href="/forgot-password" className="underline">
          Request a new one
        </Link>
        .
      </p>
    );
  }

  if (success) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-trail-700">
          Your password has been updated. You can sign in with your new password.
        </p>
        <Button href="/login" className="w-full">
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <label htmlFor="password" className="text-sm font-medium text-trail-800">
          New password
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
      <div>
        <label
          htmlFor="confirmPassword"
          className="text-sm font-medium text-trail-800"
        >
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-1 w-full rounded-xl border border-sand-300 px-4 py-2.5 focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="hero-band min-h-[calc(100vh-4rem)] border-b border-sand-200/50">
      <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16 sm:px-6 sm:py-20">
        <div className="glass rounded-3xl p-8 sm:p-10">
          <p className="section-label">Account</p>
          <h1 className="headline-lg mt-2">Reset password</h1>
          <p className="mt-3 text-sand-600">
            Choose a new password for your account.
          </p>

          <Suspense fallback={<p className="mt-8 text-sm text-sand-600">Loading...</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
