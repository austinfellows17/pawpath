import { VerificationStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  downloadVerificationDocument,
  isSupabaseStorageConfigured,
  uploadVerificationDocument,
} from "@/lib/supabase-storage";
import { appUrl } from "@/lib/app-url";
import { queueNotification } from "@/lib/notifications";

export const MAX_VERIFICATION_DOC_BYTES = 4 * 1024 * 1024; // 4MB
export const ALLOWED_VERIFICATION_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export type VerificationQueueItem = {
  id: string;
  name: string;
  email: string;
  headline: string;
  neighborhood: string | null;
  city: string | null;
  submittedAt: string | null;
  hasDocument: boolean;
};

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return session.user;
}

export async function getPendingVerifications(): Promise<VerificationQueueItem[]> {
  const profiles = await db.walkerProfile.findMany({
    where: { verificationStatus: VerificationStatus.PENDING },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { verificationSubmittedAt: "asc" },
  });

  return profiles.map((profile) => ({
    id: profile.id,
    name: profile.user.name ?? "Walker",
    email: profile.user.email,
    headline: profile.headline,
    neighborhood: profile.neighborhood,
    city: profile.city,
    submittedAt: profile.verificationSubmittedAt?.toISOString() ?? null,
    hasDocument: Boolean(profile.verificationDocStoragePath),
  }));
}

export async function reviewVerification({
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
  const status =
    action === "approve"
      ? VerificationStatus.APPROVED
      : VerificationStatus.REJECTED;

  const existing = await db.walkerProfile.findUnique({
    where: { id: walkerProfileId },
    select: { userId: true },
  });

  if (!existing) {
    throw new Error("Walker profile not found");
  }

  const [profile] = await db.$transaction([
    db.walkerProfile.update({
      where: { id: walkerProfileId },
      data: {
        verificationStatus: status,
        verificationReviewedAt: new Date(),
        verificationNotes: notes ?? null,
      },
    }),
    db.adminAction.create({
      data: {
        adminId,
        action:
          action === "approve"
            ? "VERIFICATION_APPROVED"
            : "VERIFICATION_REJECTED",
        targetType: "WalkerProfile",
        targetId: walkerProfileId,
        notes,
      },
    }),
  ]);

  const approved = action === "approve";
  queueNotification({
    userId: existing.userId,
    subject: approved
      ? "Your PawPath verification was approved"
      : "Your PawPath verification needs attention",
    emailBody: approved
      ? `Good news — your walker verification was approved. Your verified badge is now visible on your listing.\n\nView your dashboard: ${appUrl("/dashboard")}`
      : `Your verification submission was not approved.${notes ? `\n\nReviewer note: ${notes}` : ""}\n\nYou can resubmit from your dashboard: ${appUrl("/onboarding?step=verification")}`,
    smsBody: approved
      ? "PawPath: Your walker verification was approved."
      : `PawPath: Verification not approved.${notes ? ` Note: ${notes}` : ""} Resubmit in your dashboard.`,
  });

  return profile;
}

export async function submitVerificationDocument({
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
  if (!isSupabaseStorageConfigured()) {
    throw new Error(
      "Document storage is not configured. Add Supabase storage credentials to .env."
    );
  }

  const existing = await db.walkerProfile.findUnique({
    where: { userId },
    select: { verificationDocStoragePath: true },
  });

  const storagePath = await uploadVerificationDocument({
    userId,
    data,
    mimeType,
    fileName,
  });

  const profile = await db.walkerProfile.update({
    where: { userId },
    data: {
      verificationDocStoragePath: storagePath,
      verificationDocMimeType: mimeType,
      verificationDocFileName: fileName,
      verificationStatus: VerificationStatus.PENDING,
      verificationSubmittedAt: new Date(),
      verificationReviewedAt: null,
      verificationNotes: null,
    },
  });

  if (
    existing?.verificationDocStoragePath &&
    existing.verificationDocStoragePath !== storagePath
  ) {
    const { deleteVerificationDocument } = await import(
      "@/lib/supabase-storage"
    );
    void deleteVerificationDocument(existing.verificationDocStoragePath).catch(
      () => undefined
    );
  }

  return profile;
}

export async function getVerificationStatusForUser(userId: string) {
  const profile = await db.walkerProfile.findUnique({
    where: { userId },
    select: {
      verificationStatus: true,
      verificationSubmittedAt: true,
      verificationReviewedAt: true,
      verificationNotes: true,
      verificationDocFileName: true,
      verificationDocStoragePath: true,
    },
  });

  return profile;
}

export async function getVerificationDocument(walkerProfileId: string) {
  const doc = await db.walkerProfile.findUnique({
    where: { id: walkerProfileId },
    select: {
      verificationDocStoragePath: true,
      verificationDocMimeType: true,
      verificationDocFileName: true,
    },
  });

  if (!doc?.verificationDocStoragePath || !doc.verificationDocMimeType) {
    return null;
  }

  const data = await downloadVerificationDocument(
    doc.verificationDocStoragePath
  );

  return {
    data,
    mimeType: doc.verificationDocMimeType,
    fileName: doc.verificationDocFileName,
  };
}
