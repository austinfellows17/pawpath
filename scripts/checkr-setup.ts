/**
 * Validates Checkr configuration and prints setup steps.
 *
 * Usage:
 *   npx tsx scripts/checkr-setup.ts
 */

import { config } from "dotenv";
import { isCheckrConfigured, getCheckrPackageSlug } from "../src/lib/checkr";

config({ path: ".env" });

async function main() {
  const apiKey = process.env.CHECKR_API_KEY?.trim();
  const packageSlug = getCheckrPackageSlug();
  const webhookUrl = process.env.NEXTAUTH_URL
    ? `${process.env.NEXTAUTH_URL.replace(/\/$/, "")}/api/background-check/webhook`
    : "https://your-domain.com/api/background-check/webhook";

  console.log("\nPawPath — Checkr background check setup\n");

  if (!isCheckrConfigured()) {
    console.log("Add to .env:\n");
    console.log('CHECKR_API_KEY="your_checkr_api_key"');
    console.log(`CHECKR_PACKAGE_SLUG="${packageSlug}"`);
    console.log("# Optional staging:");
    console.log('# CHECKR_API_BASE="https://api.checkr-staging.com/v1"');
    console.log("\nSteps:");
    console.log("1. Create a free Checkr staging account at https://checkr.com");
    console.log("2. Dashboard → Developer → API keys → copy staging key");
    console.log("3. Note your package slug (e.g. driver_pro, tasker_standard)");
    console.log(`4. Add webhook URL in Checkr: ${webhookUrl}`);
    console.log("\nStaging runs are free (mocked results). Production checks are ~$30+/report.\n");
    process.exit(1);
  }

  const base = process.env.CHECKR_API_BASE ?? "https://api.checkr.com/v1";
  const response = await fetch(`${base}/packages`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
    },
  });

  if (!response.ok) {
    console.error(`Checkr API test failed (${response.status}). Check your API key and base URL.`);
    process.exit(1);
  }

  console.log("Checkr API key verified.");
  console.log(`Package slug: ${packageSlug}`);
  console.log(`Webhook URL: ${webhookUrl}`);
  console.log("\nPaid tier upgrades will automatically invite walkers to background screening.\n");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
