import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getApprovedReviews, submitReview } from "@/lib/reviews";

const submitSchema = z.object({
  walkerProfileId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  body: z.string().min(20).max(2000),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walkerProfileId = searchParams.get("walkerProfileId");

  if (!walkerProfileId) {
    return NextResponse.json({ error: "walkerProfileId required" }, { status: 400 });
  }

  const reviews = await getApprovedReviews(walkerProfileId);
  return NextResponse.json({ reviews });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = submitSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid review" }, { status: 400 });
  }

  try {
    const review = await submitReview({
      authorId: session.user.id,
      ...parsed.data,
    });

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        status: review.status,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to submit review";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
