/**
 * Creates the private Supabase Storage bucket for walker verification docs.
 *
 * Usage:
 *   npx tsx scripts/supabase-storage-setup.ts
 */

import { config } from "dotenv";
import {
  ensureCredentialsBucket,
  ensureProfilePhotosBucket,
  ensureVerificationBucket,
  getCredentialsBucketName,
  getProfilePhotosBucketName,
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
    console.log('SUPABASE_PROFILE_PHOTOS_BUCKET="profile-photos"');
    console.log('SUPABASE_CREDENTIALS_BUCKET="walker-credentials"');
    process.exit(1);
  }

  const verificationBucket = await ensureVerificationBucket();
  const profileBucket = await ensureProfilePhotosBucket();
  const credentialsBucket = await ensureCredentialsBucket();
  console.log(`\nReady: private bucket "${verificationBucket}" (${getVerificationBucketName()})`);
  console.log(`Ready: public bucket "${profileBucket}" (${getProfilePhotosBucketName()})`);
  console.log(`Ready: private bucket "${credentialsBucket}" (${getCredentialsBucketName()})`);
  console.log("\nWalker headshots are public. ID and credential documents stay private.\n");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
