import {
  ListingReviewStatus,
  VerificationStatus,
  type UserRole,
} from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/app-url";
import { queueNotification } from "@/lib/notifications";
import {
  canSubmitApplication,
  canSubmitByAccountAge,
  describePendingChanges,
  getAccountAgeWaitMessage,
} from "@/lib/walker-application";

export type ListingReviewQueueItem = {
  id: string;
  name: string;
  email: string;
  headline: string;
  bio: string;
  zipCode: string;
  city: string | null;
  neighborhood: string | null;
  phone: string | null;
  rate30Min: string | null;
  rate60Min: string | null;
  services: string[];
  headshotUrl: string | null;
  submittedAt: string | null;
  hasIdDocument: boolean;
  verificationStatus: VerificationStatus;
  pendingChangesSummary: string | null;
  clientReferenceName: string | null;
  clientReferenceContact: string | null;
  clientReferenceNotes: string | null;
  isResubmission: boolean;
};

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== ("ADMIN" as UserRole)) {
    throw new Error("Forbidden");
  }
  return session.user;
}

export async function getPendingListingReviews(): Promise<ListingReviewQueueItem[]> {
  const profiles = await db.walkerProfile.findMany({
    where: { listingReviewStatus: ListingReviewStatus.PENDING },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { listingSubmittedAt: "asc" },
  });

  return profiles.map((profile) => ({
    id: profile.id,
    name: profile.user.name ?? "Walker",
    email: profile.user.email,
    headline: profile.headline,
    bio: profile.bio,
    zipCode: profile.zipCode,
    city: profile.city,
    neighborhood: profile.neighborhood,
    phone: profile.phone,
    rate30Min: profile.rate30Min,
    rate60Min: profile.rate60Min,
    services: profile.services,
    headshotUrl: profile.headshotUrl,
    submittedAt: profile.listingSubmittedAt?.toISOString() ?? null,
    hasIdDocument: Boolean(profile.verificationDocStoragePath),
    verificationStatus: profile.verificationStatus,
    pendingChangesSummary: profile.pendingChangesSummary,
    clientReferenceName: profile.clientReferenceName,
    clientReferenceContact: profile.clientReferenceContact,
    clientReferenceNotes: profile.clientReferenceNotes,
    isResubmission: Boolean(
      profile.lastApprovedBio || profile.lastApprovedHeadshotUrl
    ),
  }));
}

export async function submitWalkerApplication(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { createdAt: true, role: true },
  });

  if (!user || user.role !== "WALKER") {
    throw new Error("Unauthorized");
  }

  if (!canSubmitByAccountAge(user.createdAt)) {
    throw new Error(getAccountAgeWaitMessage(user.createdAt));
  }

  const profile = await db.walkerProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new Error("Create your listing before submitting for review");
  }

  if (!canSubmitApplication(profile)) {
    throw new Error(
      "Complete your listing, headshot, and ID verification before submitting"
    );
  }

  const updated = await db.walkerProfile.update({
    where: { userId },
    data: {
      listingReviewStatus: ListingReviewStatus.PENDING,
      listingSubmittedAt: new Date(),
      listingReviewedAt: null,
      listingReviewNotes: null,
      pendingChangesSummary: null,
      isActive: false,
    },
    include: { user: { select: { name: true } } },
  });

  notifyAdminsOfApplication(updated.user.name ?? "A walker", false);

  return updated;
}

export async function triggerListingReReview({
  userId,
  changes,
}: {
  userId: string;
  changes: string[];
}) {
  if (!changes.length) return;

  const profile = await db.walkerProfile.findUnique({
    where: { userId },
    include: { user: { select: { name: true } } },
  });

  if (!profile) return;

  const wasLive =
    profile.isActive &&
    profile.listingReviewStatus === ListingReviewStatus.APPROVED;

  if (!wasLive) return;

  await db.walkerProfile.update({
    where: { userId },
    data: {
      listingReviewStatus: ListingReviewStatus.PENDING,
      listingSubmittedAt: new Date(),
      listingReviewedAt: null,
      listingReviewNotes: null,
      pendingChangesSummary: describePendingChanges(changes),
      isActive: false,
    },
  });

  queueNotification({
    userId,
    subject: "Your PawPath listing is under review again",
    emailBody: `You updated your ${describePendingChanges(changes)}. Your listing is hidden from search until an admin re-approves it.\n\nView your dashboard: ${appUrl("/dashboard")}`,
    smsBody: `PawPath: Listing hidden for re-review after ${describePendingChanges(changes)} update.`,
  });

  notifyAdminsOfApplication(
    profile.user.name ?? "A walker",
    true,
    describePendingChanges(changes)
  );
}

export async function reviewListing({
  walkerProfileId,
  adminId,
  action,
  notes,
}: {
  walkerProfileId: string;
  adminId: string;
  action: "approve" | "reject";
  notes?: string;
}) {
  const existing = await db.walkerProfile.findUnique({
    where: { id: walkerProfileId },
    select: {
      userId: true,
      verificationStatus: true,
      bio: true,
      headshotUrl: true,
    },
  });

  if (!existing) {
    throw new Error("Walker profile not found");
  }

  const approved = action === "approve";
  const listingStatus = approved
    ? ListingReviewStatus.APPROVED
    : ListingReviewStatus.REJECTED;

  const verificationUpdate =
    approved && existing.verificationStatus === VerificationStatus.PENDING
      ? {
          verificationStatus: VerificationStatus.APPROVED,
          verificationReviewedAt: new Date(),
        }
      : {};

  const [profile] = await db.$transaction([
    db.walkerProfile.update({
      where: { id: walkerProfileId },
      data: {
        listingReviewStatus: listingStatus,
        listingReviewedAt: new Date(),
        listingReviewNotes: notes ?? null,
        pendingChangesSummary: null,
        isActive: approved,
        ...(approved
          ? {
              lastApprovedBio: existing.bio,
              lastApprovedHeadshotUrl: existing.headshotUrl,
            }
          : {}),
        ...verificationUpdate,
      },
    }),
    db.adminAction.create({
      data: {
        adminId,
        action:
          action === "approve" ? "LISTING_APPROVED" : "LISTING_REJECTED",
        targetType: "WalkerProfile",
        targetId: walkerProfileId,
        notes,
      },
    }),
  ]);

  queueNotification({
    userId: existing.userId,
    subject: approved
      ? "Your PawPath listing is now live"
      : "Your PawPath listing needs changes",
    emailBody: approved
      ? `Great news — your walker listing was approved and is now visible to dog owners in your area.\n\nView your dashboard: ${appUrl("/dashboard")}`
      : `Your listing application was not approved.${notes ? `\n\nReviewer note: ${notes}` : ""}\n\nUpdate your profile and resubmit: ${appUrl("/onboarding?step=submit")}`,
    smsBody: approved
      ? "PawPath: Your walker listing is now live."
      : `PawPath: Listing not approved.${notes ? ` Note: ${notes}` : ""} Update and resubmit in your dashboard.`,
  });

  return profile;
}

function notifyAdminsOfApplication(
  walkerName: string,
  isResubmission: boolean,
  changes?: string
) {
  void db.user
    .findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    })
    .then((admins) => {
      const subject = isResubmission
        ? `Walker listing re-review: ${walkerName}`
        : `New walker application: ${walkerName}`;
      const body = isResubmission
        ? `${walkerName} updated their listing (${changes ?? "profile changes"}) and needs re-approval.\n\nReview applications: ${appUrl("/admin")}`
        : `${walkerName} submitted a walker listing for your review.\n\nReview applications: ${appUrl("/admin")}`;

      for (const admin of admins) {
        queueNotification({
          userId: admin.id,
          subject,
          emailBody: body,
          smsBody: `PawPath: ${subject}`,
        });
      }
    })
    .catch((error) => {
      console.error("Admin notification error:", error);
    });
}
