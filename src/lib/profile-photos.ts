import type { ListingTier } from "@prisma/client";
import { getPhotoLimitForTier } from "@/lib/constants";
import {
  getProfilePhotosBucketName,
  storagePathFromPublicUrl,
} from "@/lib/supabase-storage";

export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
export const ALLOWED_PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export function getGalleryUrls(photoUrls: string[], headshotUrl: string | null) {
  if (!headshotUrl) return photoUrls;
  return photoUrls.filter((url) => url !== headshotUrl);
}

export function buildPhotoUrls(
  headshotUrl: string | null,
  galleryUrls: string[]
) {
  if (!headshotUrl) return galleryUrls;
  return [headshotUrl, ...galleryUrls.filter((url) => url !== headshotUrl)];
}

export function canAddPhoto({
  tier,
  currentCount,
}: {
  tier: ListingTier;
  currentCount: number;
}) {
  return currentCount < getPhotoLimitForTier(tier);
}

export function getRemainingPhotoSlots({
  tier,
  currentCount,
}: {
  tier: ListingTier;
  currentCount: number;
}) {
  return Math.max(0, getPhotoLimitForTier(tier) - currentCount);
}

export function resolvePhotoStoragePath(publicUrl: string) {
  return storagePathFromPublicUrl(publicUrl);
}

export function isProfilePhotoUrl(publicUrl: string) {
  const bucket = getProfilePhotosBucketName();
  return publicUrl.includes(`/object/public/${bucket}/`);
}
