import { NextResponse } from "next/server";
import { z } from "zod";
import { ProfileReportReason } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { submitProfileReport } from "@/lib/profile-reports";

const reportSchema = z.object({
  reason: z.nativeEnum(ProfileReportReason),
  details: z.string().max(1000).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "OWNER") {
    return NextResponse.json(
      { error: "Only dog owners can report walker profiles" },
      { status: 403 }
    );
  }

  const { id: walkerProfileId } = await params;
  const body = await request.json();
  const parsed = reportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  }

  try {
    await submitProfileReport({
      reporterId: session.user.id,
      walkerProfileId,
      reason: parsed.data.reason,
      details: parsed.data.details,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to submit report";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
