import type { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

export async function needsOnboarding(userId: string, role: UserRole) {
  if (role === "OWNER") {
    const profile = await db.ownerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    return !profile;
  }

  if (role === "WALKER") {
    const profile = await db.walkerProfile.findUnique({
      where: { userId },
    });
    if (!profile) return true;

    const { needsWalkerOnboarding } = await import("@/lib/walker-application");
    return needsWalkerOnboarding(profile);
  }

  return false;
}

export async function getWalkerDashboardStatus(userId: string) {
  const profile = await db.walkerProfile.findUnique({
    where: { userId },
    select: {
      listingReviewStatus: true,
      listingReviewNotes: true,
      listingSubmittedAt: true,
      isActive: true,
      headshotUrl: true,
    },
  });

  return profile;
}
