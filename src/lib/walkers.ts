import { ReviewStatus, type WalkerProfile, type User } from "@prisma/client";
import { db } from "@/lib/db";
import { LAUNCH_REGION, type WalkerListing } from "@/lib/constants";
import { geocodeZipCode, haversineDistanceMiles } from "@/lib/geo";

type WalkerWithRelations = WalkerProfile & {
  user: Pick<User, "name">;
  reviews: { rating: number }[];
};

function toWalkerListing(
  profile: WalkerWithRelations,
  distanceMiles?: number
): WalkerListing {
  const reviewCount = profile.reviews.length;
  const averageRating =
    reviewCount > 0
      ? profile.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : undefined;

  return {
    id: profile.id,
    userId: profile.userId,
    name: profile.user.name ?? "Walker",
    headline: profile.headline,
    bio: profile.bio,
    services: profile.services,
    rate30Min: profile.rate30Min,
    rate60Min: profile.rate60Min,
    zipCode: profile.zipCode,
    city: profile.city,
    neighborhood: profile.neighborhood,
    latitude: profile.latitude,
    longitude: profile.longitude,
    serviceRadiusMiles: profile.serviceRadiusMiles,
    listingTier: profile.listingTier,
    verificationStatus: profile.verificationStatus,
    photoUrls: profile.photoUrls,
    distanceMiles,
    averageRating,
    reviewCount: reviewCount > 0 ? reviewCount : undefined,
  };
}

const walkerInclude = {
  user: { select: { name: true } },
  reviews: {
    where: { status: ReviewStatus.APPROVED },
    select: { rating: true },
  },
} as const;

const tierOrder = { FEATURED: 0, STANDARD: 1, BASIC: 2 } as const;

function sortWalkers(a: WalkerListing, b: WalkerListing) {
  const tierDiff = tierOrder[a.listingTier] - tierOrder[b.listingTier];
  if (tierDiff !== 0) return tierDiff;
  return (a.distanceMiles ?? 0) - (b.distanceMiles ?? 0);
}

export async function searchWalkers({
  zipCode,
  radiusMiles,
}: {
  zipCode: string;
  radiusMiles: number;
}) {
  const geocoded = await geocodeZipCode(zipCode);
  const center = geocoded ?? LAUNCH_REGION.center;

  const profiles = await db.walkerProfile.findMany({
    where: { isActive: true },
    include: walkerInclude,
  });

  const walkers = profiles
    .map((profile) => {
      const distanceMiles = haversineDistanceMiles(
        center.latitude,
        center.longitude,
        profile.latitude,
        profile.longitude
      );
      return toWalkerListing(profile, distanceMiles);
    })
    .filter((walker) => (walker.distanceMiles ?? 0) <= radiusMiles)
    .sort(sortWalkers);

  return {
    walkers,
    center: { latitude: center.latitude, longitude: center.longitude },
  };
}

export async function getWalkerById(id: string): Promise<WalkerListing | null> {
  const profile = await db.walkerProfile.findFirst({
    where: { id, isActive: true },
    include: walkerInclude,
  });

  if (!profile) return null;
  return toWalkerListing(profile);
}

export async function getFeaturedWalkers(limit = 3): Promise<WalkerListing[]> {
  const { walkers } = await searchWalkers({
    zipCode: LAUNCH_REGION.defaultZipCode,
    radiusMiles: LAUNCH_REGION.defaultRadiusMiles,
  });

  return walkers.slice(0, limit);
}
