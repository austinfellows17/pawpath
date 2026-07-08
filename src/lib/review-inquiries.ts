import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/app-url";
import { queueNotification } from "@/lib/notifications";
import { requireAdmin } from "@/lib/verification";

export { requireAdmin };

export type ReviewInquirySummary = {
  id: string;
  reviewId: string;
  subject: string;
  lastMessage: {
    body: string;
    createdAt: string;
    isFromMe: boolean;
  } | null;
  updatedAt: string;
};

export type ReviewInquiryDetail = ReviewInquirySummary & {
  authorName: string;
  walkerName: string;
  reviewExcerpt: string;
  messages: {
    id: string;
    body: string;
    senderId: string;
    senderName: string;
    createdAt: string;
    isFromMe: boolean;
  }[];
};

async function canAccessInquiry(
  inquiry: { adminId: string; authorId: string },
  userId: string,
  role: UserRole
) {
  if (role === UserRole.ADMIN) return true;
  return inquiry.authorId === userId;
}

export async function getOrCreateReviewInquiry(reviewId: string, adminId: string) {
  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { id: true, authorId: true, body: true },
  });

  if (!review) {
    throw new Error("Review not found");
  }

  return db.reviewInquiry.upsert({
    where: { reviewId },
    update: {},
    create: {
      reviewId,
      adminId,
      authorId: review.authorId,
    },
    include: {
      review: {
        include: {
          author: { select: { name: true } },
          walkerProfile: { include: { user: { select: { name: true } } } },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true, role: true } } },
      },
    },
  });
}

export async function getReviewInquiryByReviewId(reviewId: string) {
  return db.reviewInquiry.findUnique({
    where: { reviewId },
    include: {
      review: {
        include: {
          author: { select: { name: true } },
          walkerProfile: { include: { user: { select: { name: true } } } },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true, role: true } } },
      },
    },
  });
}

function toInquiryDetail(
  inquiry: NonNullable<Awaited<ReturnType<typeof getReviewInquiryByReviewId>>>,
  userId: string
): ReviewInquiryDetail {
  const walkerName =
    inquiry.review.walkerProfile.user.name ?? "Walker";
  const authorName = inquiry.review.author.name ?? "Dog owner";
  const last = inquiry.messages[inquiry.messages.length - 1];

  return {
    id: inquiry.id,
    reviewId: inquiry.reviewId,
    subject: `Review inquiry · ${walkerName}`,
    authorName,
    walkerName,
    reviewExcerpt: inquiry.review.body.slice(0, 160),
    lastMessage: last
      ? {
          body: last.body,
          createdAt: last.createdAt.toISOString(),
          isFromMe: last.senderId === userId,
        }
      : null,
    updatedAt: inquiry.updatedAt.toISOString(),
    messages: inquiry.messages.map((message) => ({
      id: message.id,
      body: message.body,
      senderId: message.senderId,
      senderName:
        message.sender.role === UserRole.ADMIN
          ? "PawPath Admin"
          : (message.sender.name ?? "Dog owner"),
      createdAt: message.createdAt.toISOString(),
      isFromMe: message.senderId === userId,
    })),
  };
}

export async function getReviewInquiryDetail(
  inquiryId: string,
  userId: string,
  role: UserRole
): Promise<ReviewInquiryDetail | null> {
  const inquiry = await db.reviewInquiry.findUnique({
    where: { id: inquiryId },
    include: {
      review: {
        include: {
          author: { select: { name: true } },
          walkerProfile: { include: { user: { select: { name: true } } } },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true, role: true } } },
      },
    },
  });

  if (!inquiry) return null;
  if (!(await canAccessInquiry(inquiry, userId, role))) return null;

  return toInquiryDetail(inquiry, userId);
}

export async function getReviewInquiriesForUser(
  userId: string,
  role: UserRole
): Promise<ReviewInquirySummary[]> {
  const inquiries = await db.reviewInquiry.findMany({
    where:
      role === UserRole.ADMIN
        ? {}
        : { authorId: userId },
    include: {
      review: {
        include: {
          walkerProfile: { include: { user: { select: { name: true } } } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true, senderId: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return inquiries.map((inquiry) => {
    const walkerName =
      inquiry.review.walkerProfile.user.name ?? "Walker";
    const last = inquiry.messages[0];

    return {
      id: inquiry.id,
      reviewId: inquiry.reviewId,
      subject: `Review inquiry · ${walkerName}`,
      lastMessage: last
        ? {
            body: last.body,
            createdAt: last.createdAt.toISOString(),
            isFromMe: last.senderId === userId,
          }
        : null,
      updatedAt: inquiry.updatedAt.toISOString(),
    };
  });
}

export async function sendReviewInquiryMessage({
  inquiryId,
  senderId,
  role,
  body,
}: {
  inquiryId: string;
  senderId: string;
  role: UserRole;
  body: string;
}) {
  const trimmedBody = body.trim();
  if (!trimmedBody) {
    throw new Error("Message cannot be empty");
  }

  const inquiry = await db.reviewInquiry.findUnique({
    where: { id: inquiryId },
    select: { adminId: true, authorId: true },
  });

  if (!inquiry) {
    throw new Error("Inquiry not found");
  }

  if (!(await canAccessInquiry(inquiry, senderId, role))) {
    throw new Error("Forbidden");
  }

  if (role === UserRole.WALKER) {
    throw new Error("Forbidden");
  }

  const [message] = await db.$transaction([
    db.reviewInquiryMessage.create({
      data: {
        inquiryId,
        senderId,
        body: trimmedBody,
      },
    }),
    db.reviewInquiry.update({
      where: { id: inquiryId },
      data: { updatedAt: new Date() },
    }),
  ]);

  const recipientId =
    senderId === inquiry.adminId ? inquiry.authorId : inquiry.adminId;
  const preview =
    trimmedBody.length > 120
      ? `${trimmedBody.slice(0, 117).trimEnd()}...`
      : trimmedBody;

  queueNotification({
    userId: recipientId,
    subject: "New PawPath support message",
    emailBody: `You have a new message from PawPath support about your review:\n\n"${preview}"\n\nOpen the thread: ${appUrl(`/messages/inquiry/${inquiryId}`)}`,
    smsBody: `PawPath support: "${preview}" View: ${appUrl(`/messages/inquiry/${inquiryId}`)}`,
  });

  return message;
}
