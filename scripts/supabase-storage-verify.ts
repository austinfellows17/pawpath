/**
 * Verifies Supabase Storage credentials and all PawPath buckets (including headshots).
 *
 * Usage:
 *   npx tsx scripts/supabase-storage-verify.ts
 */

import { config } from "dotenv";
import {
  ensureCredentialsBucket,
  ensureProfilePhotosBucket,
  ensureVerificationBucket,
  getCredentialsBucketName,
  getProfilePhotosBucketName,
  getSupabaseAdmin,
  getVerificationBucketName,
  isSupabaseStorageConfigured,
} from "../src/lib/supabase-storage";

config({ path: ".env" });

async function testBucketUpload(bucket: string, testPath: string) {
  const supabase = getSupabaseAdmin();
  const payload = new TextEncoder().encode("pawpath-storage-ok");

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(testPath, payload, { contentType: "text/plain", upsert: true });

  if (uploadError) {
    throw new Error(`Upload test failed (${bucket}): ${uploadError.message}`);
  }

  const { error: downloadError } = await supabase.storage
    .from(bucket)
    .download(testPath);

  if (downloadError) {
    throw new Error(`Download test failed (${bucket}): ${downloadError.message}`);
  }

  await supabase.storage.from(bucket).remove([testPath]);
}

async function main() {
  console.log("\nSupabase storage verification\n");

  if (!isSupabaseStorageConfigured()) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }

  console.log(`URL: ${process.env.SUPABASE_URL}`);

  const supabase = getSupabaseAdmin();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    throw new Error(`Could not list buckets: ${listError.message}`);
  }

  console.log(`Connected — ${buckets?.length ?? 0} bucket(s) visible`);

  const verificationBucket = await ensureVerificationBucket();
  const profileBucket = await ensureProfilePhotosBucket();
  const credentialsBucket = await ensureCredentialsBucket();

  console.log(`Verification bucket: ${verificationBucket} (${getVerificationBucketName()})`);
  console.log(`Profile photos bucket: ${profileBucket} (${getProfilePhotosBucketName()})`);
  console.log(`Credentials bucket: ${credentialsBucket} (${getCredentialsBucketName()})`);

  const stamp = Date.now();
  await testBucketUpload(verificationBucket, `_healthcheck/${stamp}.txt`);
  console.log("Verification bucket upload/download: ok");

  await testBucketUpload(profileBucket, `_healthcheck/${stamp}.txt`);
  console.log("Profile photos bucket upload/download: ok");

  await testBucketUpload(credentialsBucket, `_healthcheck/${stamp}.txt`);
  console.log("Credentials bucket upload/download: ok");

  console.log("\nSupabase storage is ready for walker onboarding uploads.\n");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
