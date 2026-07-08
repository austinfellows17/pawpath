import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWalkerBillingStatus } from "@/lib/billing";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "WALKER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const billing = await getWalkerBillingStatus(session.user.id);
  if (!billing) {
    return NextResponse.json({ error: "Walker profile required" }, { status: 400 });
  }

  return NextResponse.json({ billing });
}
