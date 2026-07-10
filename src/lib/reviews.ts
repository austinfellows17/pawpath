import { ReviewStatus, UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/app-url";
import { queueNotification } from "@/lib/notifications";
import { requireAdmin } from "@/lib/verification";

export { requireAdmin };

export type ReviewDisplay = {
  id: string;
  rating: number;
  body: string;
  authorLabel: string;
  createdAt: string;
};

export type ReviewQueueItem = {
  id: string;
  rating: number;
  body: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  walkerName: string;
  walkerProfileId: string;
  submittedAt: string;
  hasInquiry: boolean;
};

export type OwnerReviewState =
  | { canSubmit: false; reason: "not_owner" | "not_logged_in" | "no_conversation" | "already_reviewed" }
  | { canSubmit: true; existingReview?: { status: ReviewStatus; rating: number; body: string } };

const MIN_REVIEW_LENGTH = 20;
const MAX_REVIEW_LENGTH = 2000;

export function formatAuthorLabel(name: string | null | undefined) {
  if (!name?.trim()) return "Dog owner";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

export async function getApprovedReviews(
  walkerProfileId: string
): Promise<ReviewDisplay[]> {
  const reviews = await db.review.findMany({
    where: { walkerProfileId, status: ReviewStatus.APPROVED },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    body: review.body,
    authorLabel: formatAuthorLabel(review.author.name),
    createdAt: review.createdAt.toISOString(),
  }));
}

export async function getOwnerReviewState(
  ownerId: string | undefined,
  walkerProfileId: string
): Promise<OwnerReviewState> {
  if (!ownerId) {
    return { canSubmit: false, reason: "not_logged_in" };
  }

  const user = await db.user.findUnique({
    where: { id: ownerId },
    select: { role: true },
  });

  if (!user || user.role !== UserRole.OWNER) {
    return { canSubmit: false, reason: "not_owner" };
  }

  const walker = await db.walkerProfile.findUnique({
    where: { id: walkerProfileId },
    select: { userId: true },
  });

  if (!walker) {
    return { canSubmit: false, reason: "not_owner" };
  }

  const conversation = await db.conversation.findUnique({
    where: {
      ownerId_walkerUserId: {
        ownerId,
        walkerUserId: walker.userId,
      },
    },
  });

  if (!conversation) {
    return { canSubmit: false, reason: "no_conversation" };
  }

  const existingReview = await db.review.findUnique({
    where: {
      authorId_walkerProfileId: {
        authorId: ownerId,
        walkerProfileId,
      },
    },
  });

  if (existingReview?.status === ReviewStatus.APPROVED) {
    return { canSubmit: false, reason: "already_reviewed" };
  }

  if (existingReview) {
    return {
      canSubmit: true,
      existingReview: {
        status: existingReview.status,
        rating: existingReview.rating,
        body: existingReview.body,
      },
    };
  }

  return { canSubmit: true };
}

export async function submitReview({
  authorId,
  walkerProfileId,
  rating,
  body,
}: {
  authorId: string;
  walkerProfileId: string;
  rating: number;
  body: string;
}) {
  const trimmedBody = body.trim();

  if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    throw new Error("Rating must be between 1 and 5");
  }

  if (
    trimmedBody.length < MIN_REVIEW_LENGTH ||
    trimmedBody.length > MAX_REVIEW_LENGTH
  ) {
    throw new Error(
      `Review must be between ${MIN_REVIEW_LENGTH} and ${MAX_REVIEW_LENGTH} characters`
    );
  }

  const user = await db.user.findUnique({
    where: { id: authorId },
    select: { role: true },
  });

  if (!user || user.role !== UserRole.OWNER) {
    throw new Error("Only dog owners can leave reviews");
  }

  const walker = await db.walkerProfile.findUnique({
    where: { id: walkerProfileId, isActive: true },
    select: { userId: true },
  });

  if (!walker) {
    throw new Error("Walker not found");
  }

  const conversation = await db.conversation.findUnique({
    where: {
      ownerId_walkerUserId: {
        ownerId: authorId,
        walkerUserId: walker.userId,
      },
    },
  });

  if (!conversation) {
    throw new Error("Message this walker before leaving a review");
  }

  const existingReview = await db.review.findUnique({
    where: {
      authorId_walkerProfileId: {
        authorId,
        walkerProfileId,
      },
    },
  });

  if (existingReview?.status === ReviewStatus.APPROVED) {
    throw new Error("You already reviewed this walker");
  }

  if (existingReview?.status === ReviewStatus.PENDING) {
    return db.review.update({
      where: { id: existingReview.id },
      data: {
        rating,
        body: trimmedBody,
      },
    });
  }

  return db.review.upsert({
    where: {
      authorId_walkerProfileId: {
        authorId,
        walkerProfileId,
      },
    },
    create: {
      authorId,
      walkerProfileId,
      rating,
      body: trimmedBody,
      status: ReviewStatus.PENDING,
    },
    update: {
      rating,
      body: trimmedBody,
      status: ReviewStatus.PENDING,
    },
  });
}

export async function getPendingReviews(): Promise<ReviewQueueItem[]> {
  const reviews = await db.review.findMany({
    where: { status: ReviewStatus.PENDING },
    include: {
      author: { select: { id: true, name: true, email: true } },
      walkerProfile: {
        include: { user: { select: { name: true } } },
      },
      inquiry: { select: { id: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    body: review.body,
    authorId: review.authorId,
    authorName: review.author.name ?? "Dog owner",
    authorEmail: review.author.email,
    walkerName: review.walkerProfile.user.name ?? "Walker",
    walkerProfileId: review.walkerProfileId,
    submittedAt: review.createdAt.toISOString(),
    hasInquiry: review.inquiry !== null,
  }));
}

export async function moderateReview({
  reviewId,
  adminId,
  action,
  notes,
}: {
  reviewId: string;
  adminId: string;
  action: "approve" | "reject";
  notes?: string;
}) {
  const status =
    action === "approve" ? ReviewStatus.APPROVED : ReviewStatus.REJECTED;

  const existing = await db.review.findUnique({
    where: { id: reviewId, status: ReviewStatus.PENDING },
    include: {
      author: { select: { id: true, name: true } },
      walkerProfile: { include: { user: { select: { name: true } } } },
    },
  });

  if (!existing) {
    throw new Error("Review not found");
  }

  const [review] = await db.$transaction([
    db.review.update({
      where: { id: reviewId },
      data: { status },
    }),
    db.adminAction.create({
      data: {
        adminId,
        action:
          action === "approve" ? "REVIEW_APPROVED" : "REVIEW_REJECTED",
        targetType: "Review",
        targetId: reviewId,
        notes,
      },
    }),
  ]);

  const walkerName = existing.walkerProfile.user.name ?? "your walker";
  queueNotification({
    userId: existing.authorId,
    subject:
      action === "approve"
        ? "Your PawPath review was published"
        : "Your PawPath review was not published",
    emailBody:
      action === "approve"
        ? `Your review of ${walkerName} is now live on their profile.\n\nView walkers: ${appUrl("/find")}`
        : `Your review of ${walkerName} was not published.${notes ? `\n\nNote from our team: ${notes}` : ""}\n\nYou can submit an updated review from your messages if you've continued working with this walker.`,
    smsBody:
      action === "approve"
        ? `PawPath: Your review of ${walkerName} is now live.`
        : `PawPath: Your review of ${walkerName} was not published.`,
  });

  return review;
}
