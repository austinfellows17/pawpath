import Stripe from "stripe";
import { ListingTier } from "@prisma/client";
import {
  BACKGROUND_CHECK_ADDON,
  LISTING_TIERS,
  type PaidListingTier,
} from "@/lib/constants";

let stripeClient: Stripe | null = null;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-06-24.dahlia",
      typescript: true,
    });
  }

  return stripeClient;
}

export function getStripePriceId(tier: PaidListingTier) {
  const envKey = LISTING_TIERS[tier].stripePriceEnvKey;
  if (!envKey) return null;

  const priceId = process.env[envKey];
  if (!priceId) {
    throw new Error(`Missing ${envKey} in environment`);
  }

  return priceId;
}

export function tierFromStripePriceId(priceId: string | null | undefined): ListingTier | null {
  if (!priceId) return null;

  if (process.env.STRIPE_PRICE_FEATURED && priceId === process.env.STRIPE_PRICE_FEATURED) {
    return ListingTier.FEATURED;
  }

  if (process.env.STRIPE_PRICE_STANDARD && priceId === process.env.STRIPE_PRICE_STANDARD) {
    return ListingTier.STANDARD;
  }

  return null;
}

export function tierRank(tier: ListingTier) {
  return { FEATURED: 2, STANDARD: 1, BASIC: 0 }[tier];
}

export function getBackgroundCheckPriceId() {
  const envKey = BACKGROUND_CHECK_ADDON.stripePriceEnvKey;
  const priceId = process.env[envKey];
  if (!priceId) {
    throw new Error(`Missing ${envKey} in environment`);
  }
  return priceId;
}
