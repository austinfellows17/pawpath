import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getWalkerBillingStatus } from "@/lib/billing";
import { LISTING_TIERS, PAID_LISTING_TIERS } from "@/lib/constants";
import { BillingPortalButton, TierCheckoutButton } from "@/components/billing/tier-checkout-button";
import { BillingBackgroundCheckPanel } from "@/components/billing/background-check-panel";
import { DisclaimerBanner } from "@/components/legal/disclaimer-banner";
import { Check } from "lucide-react";
import type { ListingTier } from "@prisma/client";

const tierOrder: ListingTier[] = ["BASIC", "STANDARD", "FEATURED"];

function tierRank(tier: ListingTier) {
  return tierOrder.indexOf(tier);
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string; bg_success?: string; bg_canceled?: string }>;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard/billing");
  if (session.user.role !== "WALKER") redirect("/dashboard");

  const billing = await getWalkerBillingStatus(session.user.id);
  if (!billing) redirect("/onboarding");

  const params = await searchParams;
  const showSuccess = params.success === "1";
  const showCanceled = params.canceled === "1";
  const showBgSuccess = params.bg_success === "1";
  const showBgCanceled = params.bg_canceled === "1";

  return (
    <>
      <div className="hero-band border-b border-sand-200/50">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-14">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-trail-600 hover:text-trail-800"
          >
            ← Back to dashboard
          </Link>
          <p className="section-label mt-6">Listing visibility</p>
          <h1 className="headline-lg mt-3">Your listing tier</h1>
          <p className="body-lg mt-3 max-w-2xl">
            Invest in visibility — not transaction fees. Owners always browse and
            message for free; you pay only for how prominently you appear in
            local search.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {showSuccess && (
          <div className="mb-8 rounded-2xl border border-trail-200 bg-trail-50 p-5 text-sm text-trail-800">
            {showBgSuccess
              ? "Payment received — your tier is updating and your background check screening will begin shortly. Check your email for a Checkr invitation if configured."
              : "Payment received — your tier should update within a minute. Refresh if it hasn't changed yet."}
          </div>
        )}
        {showCanceled && (
          <div className="mb-8 rounded-2xl border border-sand-200 bg-sand-50 p-5 text-sm text-sand-700">
            Checkout canceled. You can upgrade whenever you&apos;re ready.
          </div>
        )}

        {showBgSuccess && !showSuccess && (
          <div className="mb-8 rounded-2xl border border-trail-200 bg-trail-50 p-5 text-sm text-trail-800">
            Background check payment received — screening should begin within a
            minute. Check your email for a Checkr invitation if configured.
          </div>
        )}
        {showBgCanceled && (
          <div className="mb-8 rounded-2xl border border-sand-200 bg-sand-50 p-5 text-sm text-sand-700">
            Background check checkout canceled. You can add it anytime from this
            page.
          </div>
        )}

        <div className="surface-card p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-trail-600">Current plan</p>
              <p className="mt-1 font-display text-2xl font-semibold text-trail-950">
                {billing.tierLabel}
              </p>
              {billing.subscriptionStatus && (
                <p className="mt-2 text-sm capitalize text-sand-600">
                  Subscription: {billing.subscriptionStatus.replace("_", " ")}
                </p>
              )}
              {billing.tierExpiresAt && (
                <p className="mt-1 text-sm text-sand-600">
                  Renews{" "}
                  {new Date(billing.tierExpiresAt).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
            {billing.canManageBilling && billing.configured && (
              <BillingPortalButton />
            )}
          </div>

          {!billing.configured && (
            <p className="mt-4 rounded-xl bg-sand-100 px-4 py-3 text-sm text-sand-700">
              Stripe billing isn&apos;t configured in this environment yet. Tier
              upgrades will be available once payment keys are added.
            </p>
          )}

          <BillingBackgroundCheckPanel
            isPaidTier={billing.tier === "STANDARD" || billing.tier === "FEATURED"}
            stripeConfigured={billing.configured}
          />
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {tierOrder.map((tier) => {
            const info = LISTING_TIERS[tier];
            const isCurrent = billing.tier === tier;
            const isUpgrade = tierRank(tier) > tierRank(billing.tier);
            const isDowngrade = tierRank(tier) < tierRank(billing.tier);

            return (
              <div
                key={tier}
                className={`surface-card flex flex-col p-7 ${
                  tier === "STANDARD" ? "ring-2 ring-trail-200/80" : ""
                } ${isCurrent ? "shadow-glow" : ""}`}
              >
                <p className="text-sm font-medium uppercase tracking-wide text-trail-600">
                  {info.label}
                  {isCurrent && (
                    <span className="ml-2 normal-case text-trail-500">
                      · Current
                    </span>
                  )}
                </p>
                <p className="mt-2 font-display text-2xl font-semibold text-trail-950">
                  {info.priceLabel}
                </p>
                <p className="mt-2 text-sm text-sand-700">{info.description}</p>
                <ul className="mt-4 flex-1 space-y-2">
                  {info.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-trail-800"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-trail-600" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {tier === "BASIC" ? (
                    <p className="text-center text-sm text-sand-600">
                      {isCurrent
                        ? "Your current plan"
                        : isDowngrade
                          ? "Manage via subscription portal"
                          : "Included for all walkers"}
                    </p>
                  ) : isCurrent ? (
                    <p className="text-center text-sm font-medium text-trail-700">
                      Current plan
                    </p>
                  ) : billing.configured && isUpgrade ? (
                    <TierCheckoutButton
                      tier={tier as (typeof PAID_LISTING_TIERS)[number]}
                      label={`Upgrade to ${info.label}`}
                      showBackgroundCheckUpsell={
                        billing.canPurchaseBackgroundCheckAddon
                      }
                    />
                  ) : (
                    <p className="text-center text-sm text-sand-500">
                      {isDowngrade
                        ? "Change plan in billing portal"
                        : "Unavailable"}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8">
          <DisclaimerBanner>
            Listing tier payments are for platform visibility only. PawPath does
            not process payments between owners and walkers for walks.
          </DisclaimerBanner>
        </div>
      </div>
    </>
  );
}
