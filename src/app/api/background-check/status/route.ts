import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBackgroundCheckStatusForUser } from "@/lib/background-check";
import { isCheckrConfigured } from "@/lib/checkr";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "WALKER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getBackgroundCheckStatusForUser(session.user.id);
  return NextResponse.json({
    status,
    checkrConfigured: isCheckrConfigured(),
  });
}
