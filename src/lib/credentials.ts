import { CredentialReviewStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/app-url";
import { queueNotification } from "@/lib/notifications";
import {
  downloadCredentialDocument,
  isSupabaseStorageConfigured,
  uploadCredentialDocument,
} from "@/lib/supabase-storage";
import { requireAdmin } from "@/lib/listing-review";

export { requireAdmin };

export const MAX_CREDENTIAL_DOC_BYTES = 4 * 1024 * 1024;
export const ALLOWED_CREDENTIAL_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export type CredentialQueueItem = {
  id: string;
  name: string;
  email: string;
  headline: string;
  submittedAt: string | null;
  hasDocument: boolean;
  isPro: boolean;
};

export async function getPendingCredentials(): Promise<CredentialQueueItem[]> {
  const profiles = await db.walkerProfile.findMany({
    where: { credentialStatus: CredentialReviewStatus.PENDING },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { credentialSubmittedAt: "asc" },
  });

  return profiles.map((profile) => ({
    id: profile.id,
    name: profile.user.name ?? "Walker",
    email: profile.user.email,
    headline: profile.headline,
    submittedAt: profile.credentialSubmittedAt?.toISOString() ?? null,
    hasDocument: Boolean(profile.credentialDocStoragePath),
    isPro: profile.isPro,
  }));
}

export async function submitCredentialDocument({
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
    throw new Error("Document storage is not configured");
  }

  const existing = await db.walkerProfile.findUnique({
    where: { userId },
    select: { credentialDocStoragePath: true },
  });

  if (!existing) {
    throw new Error("Create your listing before uploading credentials");
  }

  const storagePath = await uploadCredentialDocument({
    userId,
    data,
    mimeType,
    fileName,
  });

  const profile = await db.walkerProfile.update({
    where: { userId },
    data: {
      credentialDocStoragePath: storagePath,
      credentialDocMimeType: mimeType,
      credentialDocFileName: fileName,
      credentialStatus: CredentialReviewStatus.PENDING,
      credentialSubmittedAt: new Date(),
      credentialReviewedAt: null,
      credentialNotes: null,
    },
  });

  if (
    existing.credentialDocStoragePath &&
    existing.credentialDocStoragePath !== storagePath
  ) {
    const { deleteCredentialDocument } = await import("@/lib/supabase-storage");
    void deleteCredentialDocument(existing.credentialDocStoragePath).catch(
      () => undefined
    );
  }

  return profile;
}

export async function reviewCredential({
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
    select: { userId: true },
  });

  if (!existing) {
    throw new Error("Walker profile not found");
  }

  const approved = action === "approve";

  const [profile] = await db.$transaction([
    db.walkerProfile.update({
      where: { id: walkerProfileId },
      data: {
        credentialStatus: approved
          ? CredentialReviewStatus.APPROVED
          : CredentialReviewStatus.REJECTED,
        credentialReviewedAt: new Date(),
        credentialNotes: notes ?? null,
        isPro: approved,
      },
    }),
    db.adminAction.create({
      data: {
        adminId,
        action: approved ? "CREDENTIAL_APPROVED" : "CREDENTIAL_REJECTED",
        targetType: "WalkerProfile",
        targetId: walkerProfileId,
        notes,
      },
    }),
  ]);

  queueNotification({
    userId: existing.userId,
    subject: approved
      ? "Your PawPath Pro credentials were approved"
      : "Your PawPath Pro credentials need attention",
    emailBody: approved
      ? `Your insurance or certification documents were approved. The Pro badge is now on your listing.\n\nView your dashboard: ${appUrl("/dashboard")}`
      : `Your credential submission was not approved.${notes ? `\n\nReviewer note: ${notes}` : ""}\n\nYou can resubmit from your dashboard.`,
    smsBody: approved
      ? "PawPath: Pro credentials approved — badge is live."
      : `PawPath: Pro credentials not approved.${notes ? ` Note: ${notes}` : ""}`,
  });

  return profile;
}

export async function getCredentialStatusForUser(userId: string) {
  return db.walkerProfile.findUnique({
    where: { userId },
    select: {
      credentialStatus: true,
      credentialSubmittedAt: true,
      credentialReviewedAt: true,
      credentialNotes: true,
      credentialDocFileName: true,
      isPro: true,
    },
  });
}

export async function getCredentialDocument(walkerProfileId: string) {
  const doc = await db.walkerProfile.findUnique({
    where: { id: walkerProfileId },
    select: {
      credentialDocStoragePath: true,
      credentialDocMimeType: true,
      credentialDocFileName: true,
    },
  });

  if (!doc?.credentialDocStoragePath || !doc.credentialDocMimeType) {
    return null;
  }

  const data = await downloadCredentialDocument(doc.credentialDocStoragePath);

  return {
    data,
    mimeType: doc.credentialDocMimeType,
    fileName: doc.credentialDocFileName,
  };
}
