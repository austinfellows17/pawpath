import { ListingTier } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/app-url";
import { BACKGROUND_CHECK_ADDON, LISTING_TIERS } from "@/lib/constants";
import {
  getBackgroundCheckPriceId,
  getStripe,
  getStripePriceId,
  isStripeConfigured,
  tierFromStripePriceId,
} from "@/lib/stripe";
import type { PaidListingTier } from "@/lib/constants";
import { initiateBackgroundCheckForWalker } from "@/lib/background-check";

export type WalkerBillingStatus = {
  configured: boolean;
  tier: ListingTier;
  tierLabel: string;
  tierExpiresAt: string | null;
  subscriptionStatus: string | null;
  canManageBilling: boolean;
  canPurchaseBackgroundCheckAddon: boolean;
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
    canPurchaseBackgroundCheckAddon:
      !profile.backgroundCheckAddonPurchasedAt && !profile.isBackgroundChecked,
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
  includeBackgroundCheck = false,
}: {
  userId: string;
  email: string;
  name?: string | null;
  walkerProfileId: string;
  tier: PaidListingTier;
  existingCustomerId?: string | null;
  includeBackgroundCheck?: boolean;
}) {
  const stripe = getStripe();
  const priceId = getStripePriceId(tier);
  if (!priceId) {
    throw new Error("Invalid tier for checkout");
  }

  if (includeBackgroundCheck) {
    const profile = await db.walkerProfile.findUnique({
      where: { id: walkerProfileId },
      select: {
        backgroundCheckAddonPurchasedAt: true,
        isBackgroundChecked: true,
      },
    });

    if (!profile) {
      throw new Error("Walker profile required");
    }

    if (profile.backgroundCheckAddonPurchasedAt || profile.isBackgroundChecked) {
      throw new Error("Background check add-on already purchased");
    }
  }

  const customerId = await ensureStripeCustomer({
    userId,
    email,
    name,
    walkerProfileId,
    existingCustomerId,
  });

  const lineItems: Array<{ price: string; quantity: number }> = [
    { price: priceId, quantity: 1 },
  ];

  if (includeBackgroundCheck) {
    lineItems.push({ price: getBackgroundCheckPriceId(), quantity: 1 });
  }

  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: lineItems,
    success_url: includeBackgroundCheck
      ? appUrl("/dashboard/billing?success=1&bg_success=1")
      : appUrl("/dashboard/billing?success=1"),
    cancel_url: appUrl("/dashboard/billing?canceled=1"),
    metadata: {
      userId,
      walkerProfileId,
      tier,
      ...(includeBackgroundCheck ? { includeBackgroundCheck: "true" } : {}),
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

export async function createBackgroundCheckCheckoutSession({
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
  const profile = await db.walkerProfile.findUnique({
    where: { id: walkerProfileId },
    select: {
      listingTier: true,
      backgroundCheckAddonPurchasedAt: true,
      isBackgroundChecked: true,
    },
  });

  if (!profile) {
    throw new Error("Walker profile required");
  }

  if (
    profile.listingTier !== ListingTier.STANDARD &&
    profile.listingTier !== ListingTier.FEATURED
  ) {
    throw new Error("Background check add-on requires Summit or Peak tier");
  }

  if (profile.backgroundCheckAddonPurchasedAt || profile.isBackgroundChecked) {
    throw new Error("Background check add-on already purchased");
  }

  const stripe = getStripe();
  const priceId = getBackgroundCheckPriceId();
  const customerId = await ensureStripeCustomer({
    userId,
    email,
    name,
    walkerProfileId,
    existingCustomerId,
  });

  return stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: appUrl("/dashboard/billing?bg_success=1"),
    cancel_url: appUrl("/dashboard/billing?bg_canceled=1"),
    metadata: {
      checkoutType: "background_check",
      userId,
      walkerProfileId,
    },
    allow_promotion_codes: false,
  });
}

export async function fulfillBackgroundCheckPurchase({
  walkerProfileId,
  stripeSessionId,
}: {
  walkerProfileId: string;
  stripeSessionId: string;
}) {
  const profile = await db.walkerProfile.findUnique({
    where: { id: walkerProfileId },
    select: {
      backgroundCheckAddonPurchasedAt: true,
      backgroundCheckStripeSessionId: true,
    },
  });

  if (!profile) return;

  if (
    profile.backgroundCheckAddonPurchasedAt &&
    profile.backgroundCheckStripeSessionId === stripeSessionId
  ) {
    return;
  }

  if (profile.backgroundCheckAddonPurchasedAt) {
    return;
  }

  await db.walkerProfile.update({
    where: { id: walkerProfileId },
    data: {
      backgroundCheckAddonPurchasedAt: new Date(),
      backgroundCheckStripeSessionId: stripeSessionId,
    },
  });

  void initiateBackgroundCheckForWalker(walkerProfileId).catch((error) => {
    console.error("Background check initiation failed:", error);
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
