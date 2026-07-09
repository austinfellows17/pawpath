import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/listing-review";
import { suspendUser, unsuspendUser } from "@/lib/admin-users";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("suspend"),
    reason: z.string().max(2000).optional(),
  }),
  z.object({
    action: z.literal("unsuspend"),
    notes: z.string().max(2000).optional(),
  }),
]);

export async function PATCH(
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
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    if (parsed.data.action === "suspend") {
      await suspendUser({
        userId: id,
        adminId: admin.id,
        reason: parsed.data.reason,
      });
    } else {
      await unsuspendUser({
        userId: id,
        adminId: admin.id,
        notes: parsed.data.notes,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Action failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
