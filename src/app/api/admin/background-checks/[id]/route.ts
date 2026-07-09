import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/listing-review";
import { adminMarkBackgroundCheckClear } from "@/lib/background-check";

const actionSchema = z.object({
  action: z.enum(["clear"]),
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

  if (!parsed.success || parsed.data.action !== "clear") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    await adminMarkBackgroundCheckClear({
      walkerProfileId: id,
      adminId: admin.id,
      notes: parsed.data.notes,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to update background check" },
      { status: 400 }
    );
  }
}
