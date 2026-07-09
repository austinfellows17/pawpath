import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/listing-review";
import { getAdminAuditLog } from "@/lib/admin-analytics";

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    limit: searchParams.get("limit") ?? undefined,
    offset: searchParams.get("offset") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const data = await getAdminAuditLog(parsed.data);
  return NextResponse.json(data);
}
