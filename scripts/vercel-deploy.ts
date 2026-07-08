/**
 * Deploy PawPath to Vercel (test / preview environment).
 *
 * Prerequisites:
 *   1. npx vercel login
 *   2. git commit (recommended)
 *
 * Usage:
 *   npx tsx scripts/vercel-deploy.ts
 */

import { execFileSync } from "node:child_process";
import { getAppBaseUrl } from "../src/lib/app-url";

function run(command: string, args: string[]) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["inherit", "pipe", "inherit"],
    env: process.env,
  }).trim();
}

async function main() {
  console.log("\nPawPath → Vercel deploy\n");

  try {
    const user = run("npx", ["vercel", "whoami"]);
    console.log(`Logged in as: ${user}\n`);
  } catch {
    console.error("Run first: npx vercel login\n");
    process.exit(1);
  }

  console.log("Linking project (if needed)...");
  run("npx", ["vercel", "link", "--yes"]);

  console.log("\nSyncing environment variables from .env...");
  run("npx", ["tsx", "scripts/vercel-env-sync.ts"]);

  console.log("\nDeploying to production...");
  const output = run("npx", ["vercel", "deploy", "--prod", "--yes"]);
  console.log(output);

  const urlMatch = output.match(/https:\/\/[^\s]+/);
  const deployUrl = urlMatch?.[0];

  if (deployUrl) {
    console.log(`\nDeployed: ${deployUrl}\n`);
    console.log("Post-deploy checklist:");
    console.log(`1. Vercel dashboard → Settings → Environment Variables`);
    console.log(`   NEXTAUTH_URL = ${deployUrl}`);
    console.log(`2. Google Cloud → OAuth redirect URI:`);
    console.log(`   ${deployUrl}/api/auth/callback/google`);
    console.log(`3. Stripe Dashboard → Webhooks → Add endpoint:`);
    console.log(`   ${deployUrl}/api/billing/webhook`);
    console.log(`   (copy new whsec_... into Vercel as STRIPE_WEBHOOK_SECRET)`);
    console.log(`4. Redeploy after updating env vars: npx vercel deploy --prod --yes`);
    console.log(`5. Optional: npm run db:seed (uses your local .env DB)\n`);
  }

  console.log(`Current app URL helper would use: ${getAppBaseUrl()}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
