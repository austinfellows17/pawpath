import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getReviewInquiryDetail,
  sendReviewInquiryMessage,
} from "@/lib/review-inquiries";

const messageSchema = z.object({
  body: z.string().min(1).max(2000),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const inquiry = await getReviewInquiryDetail(
    id,
    session.user.id,
    session.user.role
  );

  if (!inquiry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ inquiry });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = messageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  try {
    await sendReviewInquiryMessage({
      inquiryId: id,
      senderId: session.user.id,
      role: session.user.role,
      body: parsed.data.body,
    });

    const inquiry = await getReviewInquiryDetail(
      id,
      session.user.id,
      session.user.role
    );

    return NextResponse.json({ inquiry });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send message";

    if (message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
