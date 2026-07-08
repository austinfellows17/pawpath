/**
 * Creates the private Supabase Storage bucket for walker verification docs.
 *
 * Usage:
 *   npx tsx scripts/supabase-storage-setup.ts
 */

import { config } from "dotenv";
import {
  ensureVerificationBucket,
  getVerificationBucketName,
  isSupabaseStorageConfigured,
} from "../src/lib/supabase-storage";

config({ path: ".env" });

async function main() {
  if (!isSupabaseStorageConfigured()) {
    console.error("\nAdd these to .env first:\n");
    console.log('SUPABASE_URL="https://[PROJECT-REF].supabase.co"');
    console.log("SUPABASE_SERVICE_ROLE_KEY=\"...\"");
    console.log('SUPABASE_VERIFICATION_BUCKET="verification-documents"');
    process.exit(1);
  }

  const bucket = await ensureVerificationBucket();
  console.log(`\nReady: private bucket "${bucket}" (${getVerificationBucketName()})`);
  console.log("\nWalker uploads go to Supabase Storage — not the database.");
  console.log("Only admins can view documents through the admin panel.\n");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
