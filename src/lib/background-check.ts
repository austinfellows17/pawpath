import { BackgroundCheckStatus, ListingTier } from "@prisma/client";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/app-url";
import { queueNotification } from "@/lib/notifications";
import {
  createCheckrCandidate,
  createCheckrInvitation,
  getCheckrPackageSlug,
  getCheckrReport,
  isCheckrConfigured,
  mapCheckrResultToStatus,
} from "@/lib/checkr";

const PAID_TIERS = new Set<ListingTier>([ListingTier.STANDARD, ListingTier.FEATURED]);

export function showsBackgroundCheckBadge(profile: {
  isBackgroundChecked: boolean;
  listingTier: ListingTier;
}) {
  return (
    profile.isBackgroundChecked && PAID_TIERS.has(profile.listingTier)
  );
}

export async function initiateBackgroundCheckForWalker(walkerProfileId: string) {
  const profile = await db.walkerProfile.findUnique({
    where: { id: walkerProfileId },
    include: { user: { select: { email: true, name: true } } },
  });

  if (!profile) return;
  if (!PAID_TIERS.has(profile.listingTier)) return;
  if (!profile.backgroundCheckAddonPurchasedAt) return;
  if (
    profile.backgroundCheckStatus === BackgroundCheckStatus.CLEAR &&
    profile.isBackgroundChecked
  ) {
    return;
  }

  if (isCheckrConfigured()) {
    await initiateCheckrBackgroundCheck(profile);
    return;
  }

  await db.walkerProfile.update({
    where: { id: walkerProfileId },
    data: {
      backgroundCheckStatus: BackgroundCheckStatus.PENDING,
      backgroundCheckInvitedAt: new Date(),
    },
  });

  queueNotification({
    userId: profile.userId,
    subject: "Complete your PawPath background check",
    emailBody: `Thanks for purchasing the background check add-on. PawPath will review your profile and contact you to complete screening.\n\nDashboard: ${appUrl("/dashboard/billing")}`,
    smsBody: "PawPath: Complete your background check in your billing dashboard.",
  });

  notifyAdminsOfBackgroundCheck(profile.user.name ?? "A walker", "manual");
}

async function initiateCheckrBackgroundCheck(
  profile: {
    id: string;
    userId: string;
    zipCode: string;
    city: string | null;
    checkrCandidateId: string | null;
    user: { email: string; name: string | null };
  }
) {
  const nameParts = (profile.user.name ?? "Walker User").trim().split(/\s+/);
  const firstName = nameParts[0] ?? "Walker";
  const lastName = nameParts.slice(1).join(" ") || "User";

  let candidateId = profile.checkrCandidateId;

  if (!candidateId) {
    const candidate = await createCheckrCandidate({
      email: profile.user.email,
      firstName,
      lastName,
      zipCode: profile.zipCode,
      city: profile.city,
    });
    candidateId = candidate.id;
  }

  const invitation = await createCheckrInvitation({
    candidateId,
    packageSlug: getCheckrPackageSlug(),
  });

  await db.walkerProfile.update({
    where: { id: profile.id },
    data: {
      checkrCandidateId: candidateId,
      checkrInvitationId: invitation.id,
      checkrReportId: invitation.report_id ?? null,
      backgroundCheckStatus: BackgroundCheckStatus.INVITED,
      backgroundCheckInvitedAt: new Date(),
      backgroundCheckNotes: invitation.invitation_url
        ? `Invitation URL: ${invitation.invitation_url}`
        : null,
    },
  });

  queueNotification({
    userId: profile.userId,
    subject: "Complete your PawPath background check",
    emailBody: invitation.invitation_url
      ? `Complete your background check here (valid 7 days):\n\n${invitation.invitation_url}\n\nDashboard: ${appUrl("/dashboard/billing")}`
      : `Check your email for a Checkr invitation link to complete your background check.\n\nDashboard: ${appUrl("/dashboard/billing")}`,
    smsBody: "PawPath: Check your email to complete your background check.",
  });

  notifyAdminsOfBackgroundCheck(profile.user.name ?? "A walker", "checkr");
}

export async function syncBackgroundCheckFromReport({
  reportId,
  walkerProfileId,
}: {
  reportId: string;
  walkerProfileId?: string;
}) {
  const report = await getCheckrReport(reportId);
  const mapped = mapCheckrResultToStatus(report.result);

  const profile = walkerProfileId
    ? await db.walkerProfile.findUnique({ where: { id: walkerProfileId } })
    : await db.walkerProfile.findFirst({ where: { checkrReportId: reportId } });

  if (!profile) return;

  await db.walkerProfile.update({
    where: { id: profile.id },
    data: {
      checkrReportId: report.id,
      backgroundCheckStatus: BackgroundCheckStatus[mapped.status],
      backgroundCheckCompletedAt: new Date(),
      isBackgroundChecked: mapped.isBackgroundChecked,
      backgroundCheckNotes:
        mapped.status === "CLEAR"
          ? "Checkr report clear"
          : `Checkr result: ${report.result ?? report.status}`,
    },
  });

  if (mapped.isBackgroundChecked) {
    queueNotification({
      userId: profile.userId,
      subject: "Your PawPath background check is complete",
      emailBody: `You're background check verified. Your BG Verified badge is now visible on your paid listing.\n\n${appUrl("/dashboard/billing")}`,
      smsBody: "PawPath: Background check clear — BG Verified badge is live.",
    });
  }
}

export async function adminMarkBackgroundCheckClear({
  walkerProfileId,
  adminId,
  notes,
}: {
  walkerProfileId: string;
  adminId: string;
  notes?: string;
}) {
  const profile = await db.walkerProfile.findUnique({
    where: { id: walkerProfileId },
    select: { userId: true },
  });

  if (!profile) throw new Error("Walker not found");

  await db.$transaction([
    db.walkerProfile.update({
      where: { id: walkerProfileId },
      data: {
        backgroundCheckStatus: BackgroundCheckStatus.CLEAR,
        backgroundCheckCompletedAt: new Date(),
        isBackgroundChecked: true,
        backgroundCheckNotes: notes ?? "Manually cleared by admin",
      },
    }),
    db.adminAction.create({
      data: {
        adminId,
        action: "BACKGROUND_CHECK_CLEARED",
        targetType: "WalkerProfile",
        targetId: walkerProfileId,
        notes,
      },
    }),
  ]);

  queueNotification({
    userId: profile.userId,
    subject: "Your PawPath background check is complete",
    emailBody: `You're background check verified. Your BG Verified badge is now visible on your paid listing.\n\n${appUrl("/dashboard/billing")}`,
    smsBody: "PawPath: Background check approved — BG Verified badge is live.",
  });
}

export type BackgroundCheckQueueItem = {
  id: string;
  name: string;
  email: string;
  headline: string;
  listingTier: ListingTier;
  backgroundCheckStatus: BackgroundCheckStatus;
  invitedAt: string | null;
  isBackgroundChecked: boolean;
  checkrConfigured: boolean;
};

export async function getBackgroundCheckQueue(): Promise<BackgroundCheckQueueItem[]> {
  const profiles = await db.walkerProfile.findMany({
    where: {
      listingTier: { in: [ListingTier.STANDARD, ListingTier.FEATURED] },
      backgroundCheckStatus: {
        in: [
          BackgroundCheckStatus.INVITED,
          BackgroundCheckStatus.PENDING,
          BackgroundCheckStatus.IN_PROGRESS,
          BackgroundCheckStatus.CONSIDER,
        ],
      },
    },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { backgroundCheckInvitedAt: "asc" },
  });

  return profiles.map((profile) => ({
    id: profile.id,
    name: profile.user.name ?? "Walker",
    email: profile.user.email,
    headline: profile.headline,
    listingTier: profile.listingTier,
    backgroundCheckStatus: profile.backgroundCheckStatus,
    invitedAt: profile.backgroundCheckInvitedAt?.toISOString() ?? null,
    isBackgroundChecked: profile.isBackgroundChecked,
    checkrConfigured: isCheckrConfigured(),
  }));
}

export async function getBackgroundCheckStatusForUser(userId: string) {
  return db.walkerProfile.findUnique({
    where: { userId },
    select: {
      listingTier: true,
      backgroundCheckStatus: true,
      backgroundCheckInvitedAt: true,
      backgroundCheckCompletedAt: true,
      backgroundCheckNotes: true,
      backgroundCheckAddonPurchasedAt: true,
      isBackgroundChecked: true,
      checkrInvitationId: true,
    },
  });
}

function notifyAdminsOfBackgroundCheck(walkerName: string, mode: "checkr" | "manual") {
  void db.user
    .findMany({ where: { role: "ADMIN" }, select: { id: true } })
    .then((admins) => {
      for (const admin of admins) {
        queueNotification({
          userId: admin.id,
          subject: `Background check started: ${walkerName}`,
          emailBody: `${walkerName} purchased the background check add-on (${mode === "checkr" ? "Checkr invitation sent" : "manual review"}).\n\n${appUrl("/admin/background-checks")}`,
          smsBody: `PawPath: BG check needed for ${walkerName}.`,
        });
      }
    })
    .catch(() => undefined);
}
