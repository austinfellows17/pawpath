"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ResendVerificationFormProps = {
  email: string;
  onEmailChange?: (email: string) => void;
  showEmailField?: boolean;
  buttonClassName?: string;
};

export function ResendVerificationForm({
  email,
  onEmailChange,
  showEmailField = false,
  buttonClassName,
}: ResendVerificationFormProps) {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleResend() {
    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail) {
      setError("Enter your email address");
      return;
    }

    setSending(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/auth/verify-email", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: targetEmail }),
    });

    const data = await response.json();
    setSending(false);

    if (response.ok) {
      setMessage(
        data.message ??
          "If an account exists, we sent a new verification link. Check your inbox and spam folder."
      );
    } else {
      setError(data.error ?? "Unable to send verification email.");
    }
  }

  return (
    <div className="space-y-3">
      {showEmailField && (
        <div>
          <label
            htmlFor="resend-email"
            className="text-sm font-medium text-trail-800"
          >
            Email
          </label>
          <input
            id="resend-email"
            type="email"
            required
            value={email}
            onChange={(e) => onEmailChange?.(e.target.value)}
            className="mt-1 w-full rounded-xl border border-sand-300 px-4 py-2.5 text-sm focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
          />
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        className={buttonClassName ?? "w-full"}
        disabled={sending}
        onClick={() => void handleResend()}
      >
        {sending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          "Resend verification email"
        )}
      </Button>

      {message && <p className="text-sm text-trail-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
