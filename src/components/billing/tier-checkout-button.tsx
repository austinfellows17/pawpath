"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { PaidListingTier } from "@/lib/constants";
import { Loader2 } from "lucide-react";

export function TierCheckoutButton({
  tier,
  label,
  variant = "primary",
  disabled = false,
  className,
}: {
  tier: PaidListingTier;
  label: string;
  variant?: "primary" | "outline";
  disabled?: boolean;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    setLoading(true);
    setError("");

    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Unable to start checkout");
      setLoading(false);
      return;
    }

    if (data.url) {
      window.location.href = data.url;
      return;
    }

    setError("Checkout URL missing");
    setLoading(false);
  }

  return (
    <div className={className}>
      <Button
        type="button"
        variant={variant}
        className="w-full"
        disabled={disabled || loading}
        onClick={handleCheckout}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Redirecting...
          </>
        ) : (
          label
        )}
      </Button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function BillingPortalButton({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePortal() {
    setLoading(true);
    setError("");

    const response = await fetch("/api/billing/portal", { method: "POST" });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Unable to open billing portal");
      setLoading(false);
      return;
    }

    if (data.url) {
      window.location.href = data.url;
      return;
    }

    setError("Portal URL missing");
    setLoading(false);
  }

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        disabled={disabled || loading}
        onClick={handlePortal}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Opening...
          </>
        ) : (
          "Manage subscription"
        )}
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
