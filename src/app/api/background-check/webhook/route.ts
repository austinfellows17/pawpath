import { NextResponse } from "next/server";
import { syncBackgroundCheckFromReport } from "@/lib/background-check";
import { verifyCheckrWebhookSignature } from "@/lib/checkr";
import { db } from "@/lib/db";
import { captureException } from "@/lib/monitoring";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-checkr-signature");

  if (
    !verifyCheckrWebhookSignature({
      payload: rawBody,
      signatureHeader: signature,
    })
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

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
    await captureException(error, { source: "checkr-webhook", type });
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
