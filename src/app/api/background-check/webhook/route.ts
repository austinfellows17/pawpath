import { NextResponse } from "next/server";
import { syncBackgroundCheckFromReport } from "@/lib/background-check";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();

  const type = body?.type as string | undefined;
  const data = body?.data as Record<string, unknown> | undefined;

  if (!type || !data) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    if (type === "report.completed" || type === "report.updated") {
      const reportId = data.id as string | undefined;
      const candidateId = data.candidate_id as string | undefined;

      if (!reportId) {
        return NextResponse.json({ received: true });
      }

      let walkerProfileId: string | undefined;
      if (candidateId) {
        const profile = await db.walkerProfile.findFirst({
          where: { checkrCandidateId: candidateId },
          select: { id: true },
        });
        walkerProfileId = profile?.id;
      }

      await syncBackgroundCheckFromReport({ reportId, walkerProfileId });
    }

    if (type === "invitation.completed") {
      const candidateId = data.candidate_id as string | undefined;
      const reportId = data.report_id as string | undefined;
      if (candidateId && reportId) {
        const profile = await db.walkerProfile.findFirst({
          where: { checkrCandidateId: candidateId },
          select: { id: true },
        });
        if (profile) {
          await db.walkerProfile.update({
            where: { id: profile.id },
            data: {
              checkrReportId: reportId,
              backgroundCheckStatus: "IN_PROGRESS",
            },
          });
          await syncBackgroundCheckFromReport({
            reportId,
            walkerProfileId: profile.id,
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Checkr webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
