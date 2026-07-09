import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const VERIFICATION_BUCKET =
  process.env.SUPABASE_VERIFICATION_BUCKET ?? "verification-documents";

export function isSupabaseStorageConfigured() {
  return Boolean(
    process.env.SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}

export function getVerificationBucketName() {
  return VERIFICATION_BUCKET;
}

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin() {
  if (!isSupabaseStorageConfigured()) {
    throw new Error("Supabase storage is not configured");
  }

  if (!adminClient) {
    adminClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }

  return adminClient;
}

export function sanitizeStorageFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export function buildVerificationStoragePath(userId: string, fileName: string) {
  return `${userId}/${Date.now()}-${sanitizeStorageFileName(fileName)}`;
}

export async function uploadVerificationDocument({
  userId,
  data,
  mimeType,
  fileName,
}: {
  userId: string;
  data: Uint8Array;
  mimeType: string;
  fileName: string;
}) {
  const supabase = getSupabaseAdmin();
  const storagePath = buildVerificationStoragePath(userId, fileName);

  const { error } = await supabase.storage
    .from(VERIFICATION_BUCKET)
    .upload(storagePath, data, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload verification document: ${error.message}`);
  }

  return storagePath;
}

export async function downloadVerificationDocument(storagePath: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(VERIFICATION_BUCKET)
    .download(storagePath);

  if (error || !data) {
    throw new Error("Verification document not found in storage");
  }

  return new Uint8Array(await data.arrayBuffer());
}

export async function deleteVerificationDocument(storagePath: string) {
  const supabase = getSupabaseAdmin();
  await supabase.storage.from(VERIFICATION_BUCKET).remove([storagePath]);
}

const PROFILE_PHOTOS_BUCKET =
  process.env.SUPABASE_PROFILE_PHOTOS_BUCKET ?? "profile-photos";

export function getProfilePhotosBucketName() {
  return PROFILE_PHOTOS_BUCKET;
}

export function buildProfilePhotoStoragePath(userId: string, fileName: string) {
  return `${userId}/${Date.now()}-${sanitizeStorageFileName(fileName)}`;
}

export function getProfilePhotoPublicUrl(storagePath: string) {
  const supabase = getSupabaseAdmin();
  const { data } = supabase.storage
    .from(PROFILE_PHOTOS_BUCKET)
    .getPublicUrl(storagePath);
  return data.publicUrl;
}

export function storagePathFromPublicUrl(publicUrl: string) {
  const marker = `/object/public/${PROFILE_PHOTOS_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}

export async function uploadProfilePhoto({
  userId,
  data,
  mimeType,
  fileName,
}: {
  userId: string;
  data: Uint8Array;
  mimeType: string;
  fileName: string;
}) {
  const supabase = getSupabaseAdmin();
  const storagePath = buildProfilePhotoStoragePath(userId, fileName);

  const { error } = await supabase.storage
    .from(PROFILE_PHOTOS_BUCKET)
    .upload(storagePath, data, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload profile photo: ${error.message}`);
  }

  return {
    storagePath,
    publicUrl: getProfilePhotoPublicUrl(storagePath),
  };
}

export async function deleteProfilePhoto(storagePath: string) {
  const supabase = getSupabaseAdmin();
  await supabase.storage.from(PROFILE_PHOTOS_BUCKET).remove([storagePath]);
}

export async function ensureProfilePhotosBucket() {
  const supabase = getSupabaseAdmin();
  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    throw new Error(`Failed to list buckets: ${error.message}`);
  }

  const exists = buckets?.some((bucket) => bucket.name === PROFILE_PHOTOS_BUCKET);
  if (exists) return PROFILE_PHOTOS_BUCKET;

  const { error: createError } = await supabase.storage.createBucket(
    PROFILE_PHOTOS_BUCKET,
    { public: true }
  );

  if (createError) {
    throw new Error(`Failed to create bucket: ${createError.message}`);
  }

  return PROFILE_PHOTOS_BUCKET;
}

const CREDENTIALS_BUCKET =
  process.env.SUPABASE_CREDENTIALS_BUCKET ?? "walker-credentials";

export function getCredentialsBucketName() {
  return CREDENTIALS_BUCKET;
}

export function buildCredentialStoragePath(userId: string, fileName: string) {
  return `${userId}/${Date.now()}-${sanitizeStorageFileName(fileName)}`;
}

export async function uploadCredentialDocument({
  userId,
  data,
  mimeType,
  fileName,
}: {
  userId: string;
  data: Uint8Array;
  mimeType: string;
  fileName: string;
}) {
  const supabase = getSupabaseAdmin();
  const storagePath = buildCredentialStoragePath(userId, fileName);

  const { error } = await supabase.storage
    .from(CREDENTIALS_BUCKET)
    .upload(storagePath, data, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload credential document: ${error.message}`);
  }

  return storagePath;
}

export async function downloadCredentialDocument(storagePath: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(CREDENTIALS_BUCKET)
    .download(storagePath);

  if (error || !data) {
    throw new Error("Credential document not found in storage");
  }

  return new Uint8Array(await data.arrayBuffer());
}

export async function deleteCredentialDocument(storagePath: string) {
  const supabase = getSupabaseAdmin();
  await supabase.storage.from(CREDENTIALS_BUCKET).remove([storagePath]);
}

export async function ensureCredentialsBucket() {
  const supabase = getSupabaseAdmin();
  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    throw new Error(`Failed to list buckets: ${error.message}`);
  }

  const exists = buckets?.some((bucket) => bucket.name === CREDENTIALS_BUCKET);
  if (exists) return CREDENTIALS_BUCKET;

  const { error: createError } = await supabase.storage.createBucket(
    CREDENTIALS_BUCKET,
    { public: false }
  );

  if (createError) {
    throw new Error(`Failed to create bucket: ${createError.message}`);
  }

  return CREDENTIALS_BUCKET;
}

export async function ensureVerificationBucket() {
  const supabase = getSupabaseAdmin();
  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    throw new Error(`Failed to list buckets: ${error.message}`);
  }

  const exists = buckets?.some((bucket) => bucket.name === VERIFICATION_BUCKET);
  if (exists) return VERIFICATION_BUCKET;

  const { error: createError } = await supabase.storage.createBucket(
    VERIFICATION_BUCKET,
    { public: false }
  );

  if (createError) {
    throw new Error(`Failed to create bucket: ${createError.message}`);
  }

  return VERIFICATION_BUCKET;
}
