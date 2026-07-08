import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/lib/notifications";

const updateSchema = z.object({
  emailEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  phone: z.string().max(30).optional().nullable(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const preferences = await getNotificationPreferences(session.user.id);
  return NextResponse.json({ preferences });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid preferences" }, { status: 400 });
  }

  if (!parsed.data.emailEnabled && !parsed.data.smsEnabled) {
    return NextResponse.json(
      { error: "Enable at least one notification method" },
      { status: 400 }
    );
  }

  try {
    await updateNotificationPreferences(session.user.id, parsed.data);
    const preferences = await getNotificationPreferences(session.user.id);
    return NextResponse.json({ preferences });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save preferences";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
