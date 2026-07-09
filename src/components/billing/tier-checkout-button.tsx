"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BACKGROUND_CHECK_ADDON, type PaidListingTier } from "@/lib/constants";
import { Loader2, ShieldCheck } from "lucide-react";

export function TierCheckoutButton({
  tier,
  label,
  variant = "primary",
  disabled = false,
  className,
  showBackgroundCheckUpsell = false,
}: {
  tier: PaidListingTier;
  label: string;
  variant?: "primary" | "outline";
  disabled?: boolean;
  className?: string;
  showBackgroundCheckUpsell?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [includeBackgroundCheck, setIncludeBackgroundCheck] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    setError("");

    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tier,
        includeBackgroundCheck:
          showBackgroundCheckUpsell && includeBackgroundCheck,
      }),
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
      {showBackgroundCheckUpsell && (
        <label className="mb-3 flex cursor-pointer items-start gap-2.5 rounded-xl border border-trail-200 bg-trail-50/80 p-3 text-left">
          <input
            type="checkbox"
            checked={includeBackgroundCheck}
            onChange={(event) => setIncludeBackgroundCheck(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-sand-300 text-trail-600 focus:ring-trail-500"
          />
          <span className="flex-1">
            <span className="flex items-center gap-1.5 text-sm font-medium text-trail-900">
              <ShieldCheck className="h-4 w-4 text-trail-600" />
              Add background check (+{BACKGROUND_CHECK_ADDON.priceLabel})
            </span>
            <span className="mt-1 block text-xs text-sand-600">
              Full Checkr screening and the BG Verified badge on your listing.
            </span>
          </span>
        </label>
      )}
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

export function BackgroundCheckCheckoutButton({
  label,
  disabled = false,
  className,
}: {
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    setLoading(true);
    setError("");

    const response = await fetch("/api/billing/background-check/checkout", {
      method: "POST",
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
