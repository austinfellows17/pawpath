import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { getAdminAnalytics } from "@/lib/admin-analytics";
import { requireAdmin } from "@/lib/listing-review";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const analytics = await getAdminAnalytics();
  return NextResponse.json(analytics);
}
