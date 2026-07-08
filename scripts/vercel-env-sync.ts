/**
 * Syncs .env variables to the linked Vercel project.
 * Skips empty values and comments. Overwrites existing keys.
 *
 * Prerequisite: run `npx vercel login` and `npx vercel link`
 *
 * Usage:
 *   npx tsx scripts/vercel-env-sync.ts
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

function parseEnv(contents: string) {
  const entries: Array<{ key: string; value: string }> = [];

  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!value) continue;

    // Local-only — Vercel provides VERCEL_URL; set NEXTAUTH_URL after first deploy.
    if (key === "NEXTAUTH_URL" && value.includes("localhost")) continue;

    entries.push({ key, value });
  }

  return entries;
}

function runVercel(args: string[], input?: string) {
  execFileSync("npx", ["vercel", ...args], {
    stdio: input ? ["pipe", "inherit", "inherit"] : "inherit",
    input,
    env: process.env,
  });
}

async function main() {
  try {
    runVercel(["whoami"]);
  } catch {
    console.error("\nLog in first: npx vercel login\n");
    process.exit(1);
  }

  const entries = parseEnv(readFileSync(".env", "utf8"));
  const environments = ["production", "preview", "development"];

  console.log(`\nSyncing ${entries.length} env vars to Vercel...\n`);

  for (const { key, value } of entries) {
    for (const environment of environments) {
      try {
        runVercel(
          ["env", "add", key, environment, "--force", "--yes"],
          value
        );
        console.log(`  ${key} → ${environment}`);
      } catch {
        console.error(`  Failed: ${key} (${environment})`);
      }
    }
  }

  console.log(
    "\nAfter the first deploy, set NEXTAUTH_URL to your Vercel URL in the dashboard,"
  );
  console.log("or run: npx vercel env add NEXTAUTH_URL production\n");
}

main();
