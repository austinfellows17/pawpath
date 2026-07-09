import {
  BackgroundCheckStatus,
  ListingReviewStatus,
  ListingTier,
  UserRole,
} from "@prisma/client";
import { db } from "@/lib/db";
import { LISTING_TIERS, BACKGROUND_CHECK_ADDON } from "@/lib/constants";
import { isCheckrConfigured } from "@/lib/checkr";

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}

export type AdminAnalytics = {
  generatedAt: string;
  checkrConfigured: boolean;
  users: {
    total: number;
    owners: number;
    walkers: number;
    admins: number;
    signupsToday: number;
    signupsLast7Days: number;
    signupsLast30Days: number;
    ownerSignupsLast30Days: number;
    walkerSignupsLast30Days: number;
  };
  walkers: {
    live: number;
    pendingReview: number;
    rejected: number;
    draft: number;
    byTier: Record<ListingTier, number>;
    backgroundCheckedPaid: number;
  };
  revenue: {
    estimatedMrrCents: number;
    activePaidSubscriptions: number;
    backgroundCheckAddonPurchases: number;
    backgroundCheckAddonRevenueCents: number;
    backgroundCheckAddonsLast30Days: number;
    backgroundCheckAddonsLast7Days: number;
    backgroundCheckAddonConversionRate: number;
  };
  backgroundChecks: Record<BackgroundCheckStatus, number>;
  engagement: {
    totalConversations: number;
    totalMessages: number;
    conversationsLast7Days: number;
    messagesLast7Days: number;
  };
  moderation: {
    pendingListings: number;
    pendingReports: number;
    pendingCredentials: number;
    pendingVerifications: number;
    pendingReviews: number;
    pendingBackgroundChecks: number;
  };
  signupTrend: Array<{ date: string; owners: number; walkers: number; total: number }>;
  recentSignups: Array<{
    id: string;
    name: string | null;
    email: string;
    role: UserRole;
    createdAt: string;
    walkerStatus: string | null;
    listingTier: ListingTier | null;
    isBackgroundChecked: boolean | null;
  }>;
};

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const now = new Date();
  const today = startOfDay(now);
  const last7 = daysAgo(7);
  const last30 = daysAgo(30);

  const [
    totalUsers,
    owners,
    walkers,
    admins,
    signupsToday,
    signupsLast7Days,
    signupsLast30Days,
    ownerSignupsLast30Days,
    walkerSignupsLast30Days,
    liveWalkers,
    pendingReviewWalkers,
    rejectedWalkers,
    draftWalkers,
    tierGroups,
    bgCheckedPaid,
    bgStatusGroups,
    totalConversations,
    totalMessages,
    conversationsLast7Days,
    messagesLast7Days,
    pendingListings,
    pendingReports,
    pendingCredentials,
    pendingVerifications,
    pendingReviews,
    pendingBackgroundChecks,
    paidWalkers,
    bgAddonPurchasesTotal,
    bgAddonPurchasesLast30Days,
    bgAddonPurchasesLast7Days,
    bgAddonPurchasesAmongActivePaid,
    recentUsers,
    ownerSignupsTrend,
    walkerSignupsTrend,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: UserRole.OWNER } }),
    db.user.count({ where: { role: UserRole.WALKER } }),
    db.user.count({ where: { role: UserRole.ADMIN } }),
    db.user.count({ where: { createdAt: { gte: today } } }),
    db.user.count({ where: { createdAt: { gte: last7 } } }),
    db.user.count({ where: { createdAt: { gte: last30 } } }),
    db.user.count({
      where: { role: UserRole.OWNER, createdAt: { gte: last30 } },
    }),
    db.user.count({
      where: { role: UserRole.WALKER, createdAt: { gte: last30 } },
    }),
    db.walkerProfile.count({
      where: { isActive: true, listingReviewStatus: ListingReviewStatus.APPROVED },
    }),
    db.walkerProfile.count({
      where: { listingReviewStatus: ListingReviewStatus.PENDING },
    }),
    db.walkerProfile.count({
      where: { listingReviewStatus: ListingReviewStatus.REJECTED },
    }),
    db.walkerProfile.count({
      where: { listingReviewStatus: ListingReviewStatus.NONE },
    }),
    db.walkerProfile.groupBy({
      by: ["listingTier"],
      _count: { _all: true },
    }),
    db.walkerProfile.count({
      where: {
        isBackgroundChecked: true,
        listingTier: { in: [ListingTier.STANDARD, ListingTier.FEATURED] },
      },
    }),
    db.walkerProfile.groupBy({
      by: ["backgroundCheckStatus"],
      _count: { _all: true },
    }),
    db.conversation.count(),
    db.message.count(),
    db.conversation.count({ where: { createdAt: { gte: last7 } } }),
    db.message.count({ where: { createdAt: { gte: last7 } } }),
    db.walkerProfile.count({
      where: { listingReviewStatus: ListingReviewStatus.PENDING },
    }),
    db.profileReport.count({ where: { status: "PENDING" } }),
    db.walkerProfile.count({
      where: { credentialStatus: "PENDING" },
    }),
    db.walkerProfile.count({
      where: {
        verificationStatus: "PENDING",
        listingReviewStatus: { not: ListingReviewStatus.PENDING },
      },
    }),
    db.review.count({ where: { status: "PENDING" } }),
    db.walkerProfile.count({
      where: {
        listingTier: { in: [ListingTier.STANDARD, ListingTier.FEATURED] },
        backgroundCheckAddonPurchasedAt: { not: null },
        backgroundCheckStatus: {
          in: [
            BackgroundCheckStatus.INVITED,
            BackgroundCheckStatus.PENDING,
            BackgroundCheckStatus.IN_PROGRESS,
            BackgroundCheckStatus.CONSIDER,
          ],
        },
      },
    }),
    db.walkerProfile.findMany({
      where: {
        listingTier: { in: [ListingTier.STANDARD, ListingTier.FEATURED] },
        stripeSubscriptionStatus: { in: ["active", "trialing"] },
      },
      select: { listingTier: true },
    }),
    db.walkerProfile.count({
      where: { backgroundCheckAddonPurchasedAt: { not: null } },
    }),
    db.walkerProfile.count({
      where: { backgroundCheckAddonPurchasedAt: { gte: last30 } },
    }),
    db.walkerProfile.count({
      where: { backgroundCheckAddonPurchasedAt: { gte: last7 } },
    }),
    db.walkerProfile.count({
      where: {
        listingTier: { in: [ListingTier.STANDARD, ListingTier.FEATURED] },
        stripeSubscriptionStatus: { in: ["active", "trialing"] },
        backgroundCheckAddonPurchasedAt: { not: null },
      },
    }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        walkerProfile: {
          select: {
            listingReviewStatus: true,
            listingTier: true,
            isBackgroundChecked: true,
            isActive: true,
          },
        },
      },
    }),
    db.user.findMany({
      where: { role: UserRole.OWNER, createdAt: { gte: last30 } },
      select: { createdAt: true },
    }),
    db.user.findMany({
      where: { role: UserRole.WALKER, createdAt: { gte: last30 } },
      select: { createdAt: true },
    }),
  ]);

  const byTier: Record<ListingTier, number> = {
    BASIC: 0,
    STANDARD: 0,
    FEATURED: 0,
  };
  for (const group of tierGroups) {
    byTier[group.listingTier] = group._count._all;
  }

  const backgroundChecks = Object.values(BackgroundCheckStatus).reduce(
    (acc, status) => {
      acc[status] = 0;
      return acc;
    },
    {} as Record<BackgroundCheckStatus, number>
  );
  for (const group of bgStatusGroups) {
    backgroundChecks[group.backgroundCheckStatus] = group._count._all;
  }

  const estimatedMrrCents = paidWalkers.reduce((sum, profile) => {
    return sum + LISTING_TIERS[profile.listingTier].monthlyPriceCents;
  }, 0);

  const backgroundCheckAddonRevenueCents =
    bgAddonPurchasesTotal * BACKGROUND_CHECK_ADDON.priceCents;

  const backgroundCheckAddonConversionRate =
    paidWalkers.length > 0
      ? Math.round((bgAddonPurchasesAmongActivePaid / paidWalkers.length) * 100)
      : 0;

  const signupTrend = buildSignupTrend(last30, ownerSignupsTrend, walkerSignupsTrend);

  return {
    generatedAt: now.toISOString(),
    checkrConfigured: isCheckrConfigured(),
    users: {
      total: totalUsers,
      owners,
      walkers,
      admins,
      signupsToday,
      signupsLast7Days,
      signupsLast30Days,
      ownerSignupsLast30Days,
      walkerSignupsLast30Days,
    },
    walkers: {
      live: liveWalkers,
      pendingReview: pendingReviewWalkers,
      rejected: rejectedWalkers,
      draft: draftWalkers,
      byTier,
      backgroundCheckedPaid: bgCheckedPaid,
    },
    revenue: {
      estimatedMrrCents,
      activePaidSubscriptions: paidWalkers.length,
      backgroundCheckAddonPurchases: bgAddonPurchasesTotal,
      backgroundCheckAddonRevenueCents,
      backgroundCheckAddonsLast30Days: bgAddonPurchasesLast30Days,
      backgroundCheckAddonsLast7Days: bgAddonPurchasesLast7Days,
      backgroundCheckAddonConversionRate,
    },
    backgroundChecks,
    engagement: {
      totalConversations,
      totalMessages,
      conversationsLast7Days,
      messagesLast7Days,
    },
    moderation: {
      pendingListings,
      pendingReports,
      pendingCredentials,
      pendingVerifications,
      pendingReviews,
      pendingBackgroundChecks,
    },
    signupTrend,
    recentSignups: recentUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      walkerStatus: user.walkerProfile
        ? user.walkerProfile.isActive
          ? "live"
          : user.walkerProfile.listingReviewStatus.toLowerCase()
        : null,
      listingTier: user.walkerProfile?.listingTier ?? null,
      isBackgroundChecked: user.walkerProfile?.isBackgroundChecked ?? null,
    })),
  };
}

function buildSignupTrend(
  since: Date,
  owners: Array<{ createdAt: Date }>,
  walkers: Array<{ createdAt: Date }>
) {
  const days: Record<string, { owners: number; walkers: number }> = {};

  for (let i = 0; i < 30; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    days[key] = { owners: 0, walkers: 0 };
  }

  for (const user of owners) {
    const key = user.createdAt.toISOString().slice(0, 10);
    if (days[key]) days[key].owners += 1;
  }

  for (const user of walkers) {
    const key = user.createdAt.toISOString().slice(0, 10);
    if (days[key]) days[key].walkers += 1;
  }

  return Object.entries(days).map(([date, counts]) => ({
    date,
    owners: counts.owners,
    walkers: counts.walkers,
    total: counts.owners + counts.walkers,
  }));
}

export async function getAdminUsers({
  role,
  limit = 50,
  offset = 0,
}: {
  role?: UserRole;
  limit?: number;
  offset?: number;
}) {
  const where = role ? { role } : {};

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isSuspended: true,
        suspendedAt: true,
        suspensionReason: true,
        createdAt: true,
        walkerProfile: {
          select: {
            id: true,
            listingTier: true,
            listingReviewStatus: true,
            isActive: true,
            isBackgroundChecked: true,
            backgroundCheckStatus: true,
            city: true,
            zipCode: true,
          },
        },
        ownerProfile: {
          select: { city: true, zipCode: true, dogName: true },
        },
      },
    }),
    db.user.count({ where }),
  ]);

  return {
    total,
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isSuspended: user.isSuspended,
      suspendedAt: user.suspendedAt?.toISOString() ?? null,
      suspensionReason: user.suspensionReason,
      createdAt: user.createdAt.toISOString(),
      walkerProfile: user.walkerProfile,
      ownerProfile: user.ownerProfile,
    })),
  };
}

export async function getAdminAuditLog({
  limit = 50,
  offset = 0,
}: {
  limit?: number;
  offset?: number;
}) {
  const [actions, total] = await Promise.all([
    db.adminAction.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        admin: { select: { name: true, email: true } },
      },
    }),
    db.adminAction.count(),
  ]);

  return {
    total,
    actions: actions.map((action) => ({
      id: action.id,
      action: action.action,
      targetType: action.targetType,
      targetId: action.targetId,
      notes: action.notes,
      createdAt: action.createdAt.toISOString(),
      admin: {
        name: action.admin.name,
        email: action.admin.email,
      },
    })),
  };
}
