/**
 * Verifies Supabase Storage credentials and bucket access.
 *
 * Usage:
 *   npx tsx scripts/supabase-storage-verify.ts
 */

import { config } from "dotenv";
import {
  ensureVerificationBucket,
  getSupabaseAdmin,
  getVerificationBucketName,
  isSupabaseStorageConfigured,
} from "../src/lib/supabase-storage";

config({ path: ".env" });

async function main() {
  console.log("\nSupabase storage verification\n");

  if (!isSupabaseStorageConfigured()) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }

  console.log(`URL: ${process.env.SUPABASE_URL}`);
  console.log(`Bucket: ${getVerificationBucketName()}`);

  const supabase = getSupabaseAdmin();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    throw new Error(`Could not list buckets: ${listError.message}`);
  }

  console.log(`Connected — ${buckets?.length ?? 0} bucket(s) visible`);

  const bucket = await ensureVerificationBucket();
  console.log(`Bucket ready: ${bucket}`);

  const testPath = `_healthcheck/${Date.now()}.txt`;
  const payload = new TextEncoder().encode("pawpath-storage-ok");

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(testPath, payload, { contentType: "text/plain", upsert: true });

  if (uploadError) {
    throw new Error(`Upload test failed: ${uploadError.message}`);
  }

  const { error: downloadError } = await supabase.storage
    .from(bucket)
    .download(testPath);

  if (downloadError) {
    throw new Error(`Download test failed: ${downloadError.message}`);
  }

  await supabase.storage.from(bucket).remove([testPath]);

  console.log("Upload/download test passed");
  console.log("\nSupabase storage is ready for verification documents.\n");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
