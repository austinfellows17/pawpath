import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { submitWalkerApplication } from "@/lib/listing-review";
import {
  canSubmitApplication,
  canSubmitByAccountAge,
  getAccountAgeWaitMessage,
} from "@/lib/walker-application";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "WALKER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user, profile] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { createdAt: true },
    }),
    db.walkerProfile.findUnique({ where: { userId: session.user.id } }),
  ]);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const accountAgeOk = canSubmitByAccountAge(user.createdAt);
  const applicationComplete = profile ? canSubmitApplication(profile) : false;

  return NextResponse.json({
    canSubmit: accountAgeOk && applicationComplete,
    accountAgeOk,
    applicationComplete,
    accountAgeMessage: accountAgeOk
      ? null
      : getAccountAgeWaitMessage(user.createdAt),
  });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "WALKER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await submitWalkerApplication(session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to submit application";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
