import { ListingTier } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/app-url";
import { LISTING_TIERS } from "@/lib/constants";
import {
  getStripe,
  getStripePriceId,
  isStripeConfigured,
  tierFromStripePriceId,
} from "@/lib/stripe";
import type { PaidListingTier } from "@/lib/constants";

export type WalkerBillingStatus = {
  configured: boolean;
  tier: ListingTier;
  tierLabel: string;
  tierExpiresAt: string | null;
  subscriptionStatus: string | null;
  canManageBilling: boolean;
};

export async function requireWalkerUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "WALKER") {
    throw new Error("Forbidden");
  }

  const profile = await db.walkerProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    throw new Error("Walker profile required");
  }

  return { user: session.user, profile };
}

export async function getWalkerBillingStatus(
  userId: string
): Promise<WalkerBillingStatus | null> {
  const profile = await db.walkerProfile.findUnique({
    where: { userId },
  });

  if (!profile) return null;

  return {
    configured: isStripeConfigured(),
    tier: profile.listingTier,
    tierLabel: LISTING_TIERS[profile.listingTier].label,
    tierExpiresAt: profile.tierExpiresAt?.toISOString() ?? null,
    subscriptionStatus: profile.stripeSubscriptionStatus,
    canManageBilling: Boolean(
      profile.stripeCustomerId && profile.stripeSubscriptionId
    ),
  };
}

export async function ensureStripeCustomer({
  userId,
  email,
  name,
  walkerProfileId,
  existingCustomerId,
}: {
  userId: string;
  email: string;
  name?: string | null;
  walkerProfileId: string;
  existingCustomerId?: string | null;
}) {
  if (existingCustomerId) return existingCustomerId;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    name: name ?? undefined,
    metadata: {
      userId,
      walkerProfileId,
    },
  });

  await db.walkerProfile.update({
    where: { id: walkerProfileId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export async function createTierCheckoutSession({
  userId,
  email,
  name,
  walkerProfileId,
  tier,
  existingCustomerId,
}: {
  userId: string;
  email: string;
  name?: string | null;
  walkerProfileId: string;
  tier: PaidListingTier;
  existingCustomerId?: string | null;
}) {
  const stripe = getStripe();
  const priceId = getStripePriceId(tier);
  if (!priceId) {
    throw new Error("Invalid tier for checkout");
  }
  const customerId = await ensureStripeCustomer({
    userId,
    email,
    name,
    walkerProfileId,
    existingCustomerId,
  });

  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: appUrl("/dashboard/billing?success=1"),
    cancel_url: appUrl("/dashboard/billing?canceled=1"),
    metadata: {
      userId,
      walkerProfileId,
      tier,
    },
    subscription_data: {
      metadata: {
        userId,
        walkerProfileId,
        tier,
      },
    },
    allow_promotion_codes: true,
  });
}

export async function createBillingPortalSession(customerId: string) {
  const stripe = getStripe();
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: appUrl("/dashboard/billing"),
  });
}

export async function applySubscriptionToWalker({
  walkerProfileId,
  subscription,
}: {
  walkerProfileId: string;
  subscription: {
    id: string;
    status: string;
    customer: string | { id: string };
    items: { data: Array<{ price: { id: string } }> };
    current_period_end?: number;
  };
}) {
  const priceId = subscription.items.data[0]?.price.id;
  const tier = tierFromStripePriceId(priceId);
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const activeStatuses = new Set(["active", "trialing"]);
  const isActive = activeStatuses.has(subscription.status);

  await db.walkerProfile.update({
    where: { id: walkerProfileId },
    data: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId ?? null,
      stripeSubscriptionStatus: subscription.status,
      listingTier: isActive && tier ? tier : ListingTier.BASIC,
      tierExpiresAt:
        isActive && subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null,
    },
  });
}

export async function downgradeWalkerToBasic(walkerProfileId: string) {
  await db.walkerProfile.update({
    where: { id: walkerProfileId },
    data: {
      listingTier: ListingTier.BASIC,
      tierExpiresAt: null,
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeSubscriptionStatus: "canceled",
    },
  });
}
