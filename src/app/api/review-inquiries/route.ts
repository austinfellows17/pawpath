import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getReviewInquiriesForUser } from "@/lib/review-inquiries";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "WALKER") {
    return NextResponse.json({ inquiries: [] });
  }

  const inquiries = await getReviewInquiriesForUser(
    session.user.id,
    session.user.role
  );

  return NextResponse.json({ inquiries });
}
