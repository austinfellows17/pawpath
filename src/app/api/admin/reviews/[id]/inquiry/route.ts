import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getOrCreateReviewInquiry,
  getReviewInquiryByReviewId,
  requireAdmin,
  sendReviewInquiryMessage,
} from "@/lib/review-inquiries";

const messageSchema = z.object({
  body: z.string().min(1).max(2000),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: reviewId } = await params;
  const inquiry = await getReviewInquiryByReviewId(reviewId);

  if (!inquiry) {
    return NextResponse.json({ inquiry: null });
  }

  return NextResponse.json({
    inquiry: {
      id: inquiry.id,
      reviewId: inquiry.reviewId,
      messages: inquiry.messages.map((message) => ({
        id: message.id,
        body: message.body,
        senderId: message.senderId,
        senderName:
          message.sender.role === "ADMIN"
            ? "PawPath Admin"
            : (message.sender.name ?? "Dog owner"),
        createdAt: message.createdAt.toISOString(),
        isFromMe: message.senderId === admin.id,
      })),
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: reviewId } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = messageSchema.safeParse(body);

  try {
    const inquiry = await getOrCreateReviewInquiry(reviewId, admin.id);

    if (parsed.success) {
      await sendReviewInquiryMessage({
        inquiryId: inquiry.id,
        senderId: admin.id,
        role: "ADMIN",
        body: parsed.data.body,
      });
    }

    const refreshed = await getReviewInquiryByReviewId(reviewId);

    return NextResponse.json({
      inquiry: refreshed
        ? {
            id: refreshed.id,
            reviewId: refreshed.reviewId,
            messages: refreshed.messages.map((message) => ({
              id: message.id,
              body: message.body,
              senderId: message.senderId,
              senderName:
                message.sender.role === "ADMIN"
                  ? "PawPath Admin"
                  : (message.sender.name ?? "Dog owner"),
              createdAt: message.createdAt.toISOString(),
              isFromMe: message.senderId === admin.id,
            })),
          }
        : null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start inquiry";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
