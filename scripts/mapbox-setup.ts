/**
 * Mapbox setup helper for PawPath search + map view.
 *
 * Usage:
 *   npx tsx scripts/mapbox-setup.ts
 */

import { config } from "dotenv";
import { isMapboxConfigured, verifyMapboxToken } from "../src/lib/mapbox";

config({ path: ".env" });

async function main() {
  console.log("\nMapbox setup for PawPath\n");
  console.log("1. Sign up at https://account.mapbox.com/auth/signup/");
  console.log("2. Open https://account.mapbox.com/access-tokens/");
  console.log("3. Copy your default public token (starts with pk.)");
  console.log('4. Add to .env: NEXT_PUBLIC_MAPBOX_TOKEN="pk...."');
  console.log("5. Restart the dev server and open /find → Map view\n");

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim();
  if (!token) {
    console.log("Status: NEXT_PUBLIC_MAPBOX_TOKEN is not set yet.\n");
    console.log(
      "Without Mapbox, zip search still works using built-in North County fallbacks.\n"
    );
    return;
  }

  if (!token.startsWith("pk.")) {
    console.warn(
      "Warning: Mapbox public tokens usually start with pk. — double-check you copied the public token, not a secret.\n"
    );
  }

  try {
    const place = await verifyMapboxToken(token);
    console.log("Status: Mapbox token verified.");
    console.log(`Test geocode (92024): ${place}\n`);
  } catch (error) {
    console.error(
      "Status: token present but verification failed:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

main();
