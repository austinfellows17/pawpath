/**
 * Fetches the local Stripe CLI webhook signing secret and writes it to .env.
 *
 * Prerequisite: Stripe CLI installed (see scripts/install-stripe-cli.sh).
 *
 * Usage:
 *   npx tsx scripts/stripe-webhook-setup.ts
 *
 * Then run the listener (keep it open while testing billing):
 *   npm run stripe:listen
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { config } from "dotenv";

function resolveStripeCli(): string {
  const candidates = [
    process.env.STRIPE_CLI_PATH,
    join(homedir(), ".local/bin/stripe"),
    "/opt/homebrew/bin/stripe",
    "/usr/local/bin/stripe",
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      execFileSync(candidate, ["--version"], { stdio: "ignore" });
      return candidate;
    } catch {
      // try next path
    }
  }

  throw new Error(
    "Stripe CLI not found. Run: bash scripts/install-stripe-cli.sh"
  );
}

function updateEnvWebhookSecret(secret: string) {
  const envPath = ".env";
  const contents = readFileSync(envPath, "utf8");
  const line = `STRIPE_WEBHOOK_SECRET="${secret}"`;

  const updated = contents.match(/^STRIPE_WEBHOOK_SECRET=/m)
    ? contents.replace(/^STRIPE_WEBHOOK_SECRET=.*$/m, line)
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

  const stripeCli = resolveStripeCli();
  const output = execFileSync(
    stripeCli,
    [
      "listen",
      "--forward-to",
      "localhost:3000/api/billing/webhook",
      "--print-secret",
    ],
    {
      env: { ...process.env, STRIPE_API_KEY: secretKey },
      encoding: "utf8",
    }
  );

  const match = output.match(/whsec_[A-Za-z0-9]+/);
  if (!match) {
    console.error("Could not read webhook signing secret from Stripe CLI.");
    console.error("Run manually: stripe listen --print-secret");
    process.exit(1);
  }

  updateEnvWebhookSecret(match[0]);
  console.log("Updated STRIPE_WEBHOOK_SECRET in .env");
  console.log("\nStart forwarding webhooks locally:");
  console.log("  npm run stripe:listen");
  console.log("\nRestart the dev server so Next.js picks up the new secret.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
