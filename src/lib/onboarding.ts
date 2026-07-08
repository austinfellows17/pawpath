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
      select: { id: true },
    });
    return !profile;
  }

  return false;
}
