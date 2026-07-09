/**
 * Sync specific .env keys to Vercel (faster than full vercel-env-sync.ts).
 *
 * Usage:
 *   npx tsx scripts/vercel-env-sync-keys.ts SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { config } from "dotenv";

config({ path: ".env" });

const keys = process.argv.slice(2);
if (keys.length === 0) {
  console.error("Usage: npx tsx scripts/vercel-env-sync-keys.ts KEY [KEY...]");
  process.exit(1);
}

function runVercel(args: string[], input?: string) {
  execFileSync("./node_modules/.bin/vercel", args, {
    stdio: input ? ["pipe", "inherit", "inherit"] : "inherit",
    input,
    env: process.env,
  });
}

async function main() {
  runVercel(["whoami"]);

  const environments = ["production", "preview"] as const;

  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (!value) {
      console.error(`Missing ${key} in .env — skipped`);
      continue;
    }

    for (const environment of environments) {
      runVercel(
        ["env", "add", key, environment, "--force", "--yes"],
        value
      );
      console.log(`  ${key} → ${environment}`);
    }
  }

  console.log("\nRedeploy production to apply: ./node_modules/.bin/vercel deploy --prod --yes\n");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
