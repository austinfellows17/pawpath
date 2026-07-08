/**
 * Forwards Stripe webhook events to the local PawPath dev server.
 * Keep this running in a separate terminal while testing billing.
 */

import { spawn } from "node:child_process";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import { config } from "dotenv";

config({ path: ".env" });

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey?.startsWith("sk_")) {
  console.error("Add STRIPE_SECRET_KEY to .env first.");
  process.exit(1);
}

const candidates = [
  process.env.STRIPE_CLI_PATH,
  join(homedir(), ".local/bin/stripe"),
  "/opt/homebrew/bin/stripe",
  "/usr/local/bin/stripe",
  "stripe",
].filter(Boolean) as string[];

let stripeCli = "stripe";
for (const candidate of candidates) {
  try {
    execFileSync(candidate, ["--version"], { stdio: "ignore" });
    stripeCli = candidate;
    break;
  } catch {
    // try next
  }
}

console.log("Forwarding Stripe webhooks to http://localhost:3000/api/billing/webhook");
console.log("Press Ctrl+C to stop.\n");

const child = spawn(
  stripeCli,
  ["listen", "--forward-to", "localhost:3000/api/billing/webhook"],
  {
    stdio: "inherit",
    env: { ...process.env, STRIPE_API_KEY: secretKey },
  }
);

child.on("exit", (code) => process.exit(code ?? 0));
