/**
 * Prints Google OAuth setup steps for PawPath.
 *
 * Usage:
 *   npx tsx scripts/google-oauth-setup.ts
 */

import { config } from "dotenv";
import { getGoogleOAuthRedirectUris, isGoogleAuthConfigured } from "../src/lib/google-auth";

config({ path: ".env" });

const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
const redirectUris = getGoogleOAuthRedirectUris(appUrl);

console.log("\nGoogle sign-in setup for PawPath\n");
console.log("1. Open https://console.cloud.google.com/apis/credentials");
console.log("2. Create a project (or pick an existing one)");
console.log("3. Configure OAuth consent screen (External is fine for testing)");
console.log("4. Create credentials → OAuth client ID → Web application");
console.log("5. Add these Authorized redirect URIs:\n");

for (const uri of redirectUris) {
  console.log(`   ${uri}`);
}

console.log("\n6. Copy the Client ID and Client secret into .env:\n");
console.log('   GOOGLE_CLIENT_ID="..."');
console.log('   GOOGLE_CLIENT_SECRET="..."');
console.log("\n7. Restart the dev server, then test at /login or /signup\n");

if (isGoogleAuthConfigured()) {
  console.log("Status: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set.\n");
} else {
  console.log("Status: Google credentials are not configured yet.\n");
}
