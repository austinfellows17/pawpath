import { ProfileReportReason, ProfileReportStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/app-url";
import { queueNotification } from "@/lib/notifications";

export const PROFILE_REPORT_REASONS: {
  value: ProfileReportReason;
  label: string;
}[] = [
  { value: "MISLEADING_PROFILE", label: "Misleading or inaccurate profile" },
  { value: "UNPROFESSIONAL", label: "Unprofessional behavior" },
  { value: "SAFETY_CONCERN", label: "Safety concern" },
  { value: "SPAM", label: "Spam or fake listing" },
  { value: "OTHER", label: "Other" },
];

export type ProfileReportQueueItem = {
  id: string;
  walkerProfileId: string;
  walkerName: string;
  reporterName: string;
  reporterEmail: string;
  reason: ProfileReportReason;
  details: string | null;
  createdAt: string;
};

export async function getPendingProfileReports(): Promise<ProfileReportQueueItem[]> {
  const reports = await db.profileReport.findMany({
    where: { status: ProfileReportStatus.PENDING },
    include: {
      walkerProfile: {
        include: { user: { select: { name: true } } },
      },
      reporter: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return reports.map((report) => ({
    id: report.id,
    walkerProfileId: report.walkerProfileId,
    walkerName: report.walkerProfile.user.name ?? "Walker",
    reporterName: report.reporter.name ?? "Owner",
    reporterEmail: report.reporter.email,
    reason: report.reason,
    details: report.details,
    createdAt: report.createdAt.toISOString(),
  }));
}

export async function submitProfileReport({
  reporterId,
  walkerProfileId,
  reason,
  details,
}: {
  reporterId: string;
  walkerProfileId: string;
  reason: ProfileReportReason;
  details?: string;
}) {
  const walker = await db.walkerProfile.findFirst({
    where: { id: walkerProfileId, isActive: true },
    include: { user: { select: { name: true } } },
  });

  if (!walker) {
    throw new Error("Walker not found");
  }

  if (walker.userId === reporterId) {
    throw new Error("You cannot report your own listing");
  }

  const report = await db.profileReport.upsert({
    where: {
      reporterId_walkerProfileId: { reporterId, walkerProfileId },
    },
    update: {
      reason,
      details: details ?? null,
      status: ProfileReportStatus.PENDING,
      adminNotes: null,
      reviewedAt: null,
      reviewedById: null,
    },
    create: {
      reporterId,
      walkerProfileId,
      reason,
      details: details ?? null,
    },
  });

  notifyAdminsOfReport(walker.user.name ?? "A walker", reason);

  return report;
}

export async function reviewProfileReport({
  reportId,
  adminId,
  action,
  notes,
  deactivateWalker,
}: {
  reportId: string;
  adminId: string;
  action: "reviewed" | "dismissed";
  notes?: string;
  deactivateWalker?: boolean;
}) {
  const report = await db.profileReport.findUnique({
    where: { id: reportId },
    select: { walkerProfileId: true, reporterId: true },
  });

  if (!report) {
    throw new Error("Report not found");
  }

  const status =
    action === "dismissed"
      ? ProfileReportStatus.DISMISSED
      : ProfileReportStatus.REVIEWED;

  await db.$transaction([
    db.profileReport.update({
      where: { id: reportId },
      data: {
        status,
        adminNotes: notes ?? null,
        reviewedAt: new Date(),
        reviewedById: adminId,
      },
    }),
    db.adminAction.create({
      data: {
        adminId,
        action:
          action === "dismissed" ? "PROFILE_REPORT_DISMISSED" : "PROFILE_REPORT_REVIEWED",
        targetType: "ProfileReport",
        targetId: reportId,
        notes,
      },
    }),
    ...(deactivateWalker
      ? [
          db.walkerProfile.update({
            where: { id: report.walkerProfileId },
            data: { isActive: false },
          }),
        ]
      : []),
  ]);

  return report;
}

function notifyAdminsOfReport(walkerName: string, reason: ProfileReportReason) {
  const reasonLabel =
    PROFILE_REPORT_REASONS.find((item) => item.value === reason)?.label ?? reason;

  void db.user
    .findMany({ where: { role: "ADMIN" }, select: { id: true } })
    .then((admins) => {
      for (const admin of admins) {
        queueNotification({
          userId: admin.id,
          subject: `Walker profile reported: ${walkerName}`,
          emailBody: `A dog owner reported ${walkerName} for "${reasonLabel}".\n\nReview reports: ${appUrl("/admin")}`,
          smsBody: `PawPath: Profile reported (${reasonLabel}). Check admin.`,
        });
      }
    })
    .catch((error) => {
      console.error("Admin report notification error:", error);
    });
}
