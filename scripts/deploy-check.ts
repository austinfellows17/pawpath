/**
 * Pre-deploy checklist — validates required environment variables.
 *
 * Usage:
 *   npx tsx scripts/deploy-check.ts
 *   npx tsx scripts/deploy-check.ts --production
 */

import { config } from "dotenv";
import { isGoogleAuthConfigured } from "../src/lib/google-auth";
import { isEmailVerificationRequired } from "../src/lib/email-verification";
import { isMapboxConfigured, verifyMapboxToken } from "../src/lib/mapbox";
import { isCheckrWebhookVerificationConfigured } from "../src/lib/checkr";
import {
  isEmailConfigured,
  isSmsConfigured,
} from "../src/lib/notifications";
import { isSupabaseStorageConfigured } from "../src/lib/supabase-storage";

config({ path: ".env" });

const isProduction = process.argv.includes("--production");

type Check = {
  name: string;
  ok: boolean;
  required: boolean;
  note?: string;
};

function has(name: string) {
  return Boolean(process.env[name]?.trim());
}

function checkStripe() {
  return (
    has("STRIPE_SECRET_KEY") &&
    has("STRIPE_WEBHOOK_SECRET") &&
    has("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY") &&
    has("STRIPE_PRICE_STANDARD") &&
    has("STRIPE_PRICE_FEATURED") &&
    has("STRIPE_PRICE_BACKGROUND_CHECK")
  );
}

async function main() {
  const checks: Check[] = [
    {
      name: "DATABASE_URL",
      ok: has("DATABASE_URL"),
      required: true,
    },
    {
      name: "DIRECT_URL",
      ok: has("DIRECT_URL"),
      required: true,
    },
    {
      name: "NEXTAUTH_URL",
      ok: has("NEXTAUTH_URL"),
      required: true,
      note: isProduction
        ? "Set to your production domain, e.g. https://pawpath.com"
        : undefined,
    },
    {
      name: "NEXTAUTH_SECRET",
      ok: has("NEXTAUTH_SECRET"),
      required: true,
    },
    {
      name: "Supabase storage",
      ok: isSupabaseStorageConfigured(),
      required: true,
    },
    {
      name: "Stripe billing",
      ok: checkStripe(),
      required: true,
      note: isProduction
        ? "Use live keys + production webhook endpoint"
        : undefined,
    },
    {
      name: "Resend email",
      ok: isEmailConfigured(),
      required: true,
    },
    {
      name: "Email verification enabled",
      ok: !isEmailVerificationRequired() || isEmailConfigured(),
      required: true,
      note: isEmailVerificationRequired()
        ? "REQUIRE_EMAIL_VERIFICATION=true requires Resend"
        : undefined,
    },
    {
      name: "Google sign-in",
      ok: isGoogleAuthConfigured(),
      required: false,
    },
    {
      name: "Mapbox map",
      ok: isMapboxConfigured(),
      required: isProduction,
      note: isProduction
        ? "Required for launch-quality /find map view"
        : undefined,
    },
    {
      name: "Checkr webhook secret",
      ok: isCheckrWebhookVerificationConfigured(),
      required: isProduction && Boolean(process.env.CHECKR_API_KEY?.trim()),
      note: "Set CHECKR_WEBHOOK_SECRET from Checkr dashboard webhook settings",
    },
    {
      name: "Twilio SMS",
      ok: isSmsConfigured(),
      required: false,
    },
  ];

  console.log(
    `\nPawPath deploy check${isProduction ? " (production)" : " (local)"}\n`
  );

  let failedRequired = 0;

  for (const check of checks) {
    const status = check.ok ? "ok" : check.required ? "MISSING" : "optional";
    console.log(`[${status}] ${check.name}${check.note ? ` — ${check.note}` : ""}`);
    if (!check.ok && check.required) failedRequired++;
  }

  if (isMapboxConfigured()) {
    try {
      const place = await verifyMapboxToken(
        process.env.NEXT_PUBLIC_MAPBOX_TOKEN!
      );
      console.log(`\nMapbox geocode test: ${place}`);
    } catch (error) {
      console.log(
        `\nMapbox token failed verification: ${
          error instanceof Error ? error.message : error
        }`
      );
      failedRequired++;
    }
  }

  console.log("\nProduction reminders:");
  console.log("- Vercel env vars for all required items above");
  console.log("- Stripe webhook: https://YOUR_DOMAIN/api/billing/webhook");
  console.log(
    "- Google OAuth redirect: https://YOUR_DOMAIN/api/auth/callback/google"
  );
  console.log("- Resend: verify your domain and update EMAIL_FROM");
  console.log("- Run: npm run build\n");

  if (failedRequired > 0) {
    console.error(`${failedRequired} required check(s) failed.\n`);
    process.exit(1);
  }

  if (isSupabaseStorageConfigured()) {
    try {
      const { execFileSync } = await import("node:child_process");
      execFileSync("npx", ["tsx", "scripts/supabase-storage-verify.ts"], {
        stdio: "inherit",
        env: process.env,
      });
    } catch {
      console.error("Supabase storage verification failed.\n");
      process.exit(1);
    }
  }

  console.log("Required checks passed.\n");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
