import { NextResponse } from "next/server";
import { getUnreadMessageCount, requireAuthUser } from "@/lib/messages";

export async function GET() {
  try {
    const user = await requireAuthUser();
    const count = await getUnreadMessageCount(user.id);
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
