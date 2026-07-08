/**
 * One-time setup helper — creates Stripe products/prices for PawPath tiers.
 *
 * Usage:
 *   npx tsx scripts/stripe-setup.ts
 *
 * Copy the printed Price IDs into .env as STRIPE_PRICE_STANDARD and STRIPE_PRICE_FEATURED.
 */

import { config } from "dotenv";
import Stripe from "stripe";

async function main() {
  config({ path: ".env" });

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error("Add STRIPE_SECRET_KEY to .env first.");
    process.exit(1);
  }

  if (!secretKey.startsWith("sk_")) {
    console.error(
      "STRIPE_SECRET_KEY should start with sk_test_ or sk_live_ — not mk_ (restricted key)."
    );
    console.error(
      "In Stripe Dashboard → Developers → API keys, reveal the Secret key."
    );
    process.exit(1);
  }

  const stripe = new Stripe(secretKey);

  const summitProduct = await stripe.products.create({
    name: "PawPath Summit",
    description: "Summit listing tier — priority placement in local search",
    metadata: { tier: "STANDARD" },
  });

  const summitPrice = await stripe.prices.create({
    product: summitProduct.id,
    unit_amount: 1900,
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { tier: "STANDARD" },
  });

  const peakProduct = await stripe.products.create({
    name: "PawPath Peak",
    description: "Peak listing tier — top placement and featured profile",
    metadata: { tier: "FEATURED" },
  });

  const peakPrice = await stripe.prices.create({
    product: peakProduct.id,
    unit_amount: 3900,
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { tier: "FEATURED" },
  });

  console.log("\nAdd these to your .env:\n");
  console.log(`STRIPE_PRICE_STANDARD="${summitPrice.id}"`);
  console.log(`STRIPE_PRICE_FEATURED="${peakPrice.id}"`);
  console.log("\nWebhook endpoint: POST /api/billing/webhook");
  console.log("Listen locally: stripe listen --forward-to localhost:3000/api/billing/webhook\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
