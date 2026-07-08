import { NextResponse } from "next/server";
import { getPendingVerifications, requireAdmin } from "@/lib/verification";

export async function GET() {
  try {
    await requireAdmin();
    const verifications = await getPendingVerifications();
    return NextResponse.json({ verifications });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
