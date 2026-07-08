import { NextResponse } from "next/server";
import { z } from "zod";
import { moderateReview, requireAdmin } from "@/lib/reviews";

const actionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  notes: z.string().max(1000).optional(),
});

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

  const { id } = await params;
  const body = await request.json();
  const parsed = actionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    await moderateReview({
      reviewId: id,
      adminId: admin.id,
      action: parsed.data.action,
      notes: parsed.data.notes,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to moderate review" },
      { status: 400 }
    );
  }
}
