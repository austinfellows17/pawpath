"use client";

import { useEffect, useState } from "react";
import { BackgroundCheckedBadge } from "@/components/walkers/background-checked-badge";
import { BackgroundCheckCheckoutButton } from "@/components/billing/tier-checkout-button";
import { BACKGROUND_CHECK_ADDON } from "@/lib/constants";
import { Loader2, ShieldCheck } from "lucide-react";

type BgStatus = {
  listingTier: string;
  backgroundCheckStatus: string;
  backgroundCheckInvitedAt: string | null;
  backgroundCheckCompletedAt: string | null;
  backgroundCheckAddonPurchasedAt: string | null;
  isBackgroundChecked: boolean;
};

export function BillingBackgroundCheckPanel({
  isPaidTier,
  stripeConfigured,
}: {
  isPaidTier: boolean;
  stripeConfigured: boolean;
}) {
  const [status, setStatus] = useState<BgStatus | null>(null);
  const [checkrConfigured, setCheckrConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPaidTier) {
      setLoading(false);
      return;
    }

    void fetch("/api/background-check/status")
      .then((r) => r.json())
      .then((data) => {
        setStatus(data.status);
        setCheckrConfigured(data.checkrConfigured);
      })
      .finally(() => setLoading(false));
  }, [isPaidTier]);

  if (!isPaidTier) return null;

  if (loading) {
    return (
      <div className="mt-6 flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-trail-600" />
      </div>
    );
  }

  if (!status) return null;

  if (status.isBackgroundChecked) {
    return (
      <div className="mt-6 rounded-2xl border border-trail-200 bg-trail-50 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <BackgroundCheckedBadge size="md" />
          <div>
            <p className="font-medium text-trail-900">Background check complete</p>
            <p className="text-sm text-trail-700">
              Your BG Verified badge is visible on your listing while your paid
              tier is active.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const hasPurchasedAddon = Boolean(status.backgroundCheckAddonPurchasedAt);

  if (!hasPurchasedAddon) {
    return (
      <div className="mt-6 rounded-2xl border border-sand-200 bg-white p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-trail-600" />
          <div className="flex-1">
            <p className="font-medium text-trail-900">
              Background check add-on
            </p>
            <p className="mt-2 text-sm text-sand-700">
              {BACKGROUND_CHECK_ADDON.description} Available for Summit and
              Peak tiers only — one-time {BACKGROUND_CHECK_ADDON.priceLabel}{" "}
              fee.
            </p>
            {stripeConfigured ? (
              <div className="mt-4 max-w-xs">
                <BackgroundCheckCheckoutButton
                  label={`Add background check — ${BACKGROUND_CHECK_ADDON.priceLabel}`}
                />
              </div>
            ) : (
              <p className="mt-3 text-sm text-sand-500">
                Payment processing isn&apos;t configured in this environment
                yet.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-5">
      <p className="font-medium text-trail-900">Background check in progress</p>
      <p className="mt-2 text-sm text-sand-700">
        Status:{" "}
        <strong className="capitalize">
          {status.backgroundCheckStatus.toLowerCase().replace("_", " ")}
        </strong>
      </p>
      <p className="mt-2 text-sm text-sand-600">
        {checkrConfigured
          ? "Check your email for a Checkr invitation link. Complete it within 7 days to earn your BG Verified badge."
          : "Our team will contact you to complete your background screening."}
      </p>
    </div>
  );
}
