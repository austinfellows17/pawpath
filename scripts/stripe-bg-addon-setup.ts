/**
 * Creates the one-time Stripe price for the $50 background check add-on.
 * Does not recreate Summit/Peak subscription prices.
 *
 * Usage:
 *   npx tsx scripts/stripe-bg-addon-setup.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { config } from "dotenv";
import Stripe from "stripe";

function upsertEnvKey(key: string, value: string) {
  const envPath = ".env";
  const line = `${key}="${value}"`;
  const contents = readFileSync(envPath, "utf8");

  const updated = contents.match(new RegExp(`^${key}=`, "m"))
    ? contents.replace(new RegExp(`^${key}=.*$`, "m"), line)
    : `${contents.trimEnd()}\n${line}\n`;

  writeFileSync(envPath, updated);
}

async function main() {
  config({ path: ".env" });

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey?.startsWith("sk_")) {
    console.error("Add a valid STRIPE_SECRET_KEY to .env first.");
    process.exit(1);
  }

  const existing = process.env.STRIPE_PRICE_BACKGROUND_CHECK;
  if (existing?.startsWith("price_")) {
    console.log(`STRIPE_PRICE_BACKGROUND_CHECK already set: ${existing}`);
    return;
  }

  const stripe = new Stripe(secretKey);

  const product = await stripe.products.create({
    name: "PawPath Background Check",
    description:
      "One-time full background screening via Checkr + BG Verified badge (Summit/Peak add-on)",
    metadata: { product: "background_check" },
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 5000,
    currency: "usd",
    metadata: { product: "background_check" },
  });

  upsertEnvKey("STRIPE_PRICE_BACKGROUND_CHECK", price.id);

  console.log("\nBackground check add-on created in Stripe.\n");
  console.log(`STRIPE_PRICE_BACKGROUND_CHECK="${price.id}"`);
  console.log("\nAdded to .env — sync to Vercel: npm run vercel:env-sync\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
