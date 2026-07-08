import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getConversationWithWalker } from "@/lib/messages";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ walkerProfileId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ conversation: null });
  }

  const { walkerProfileId } = await params;

  if (session.user.role !== "OWNER") {
    return NextResponse.json({ conversation: null });
  }

  const conversation = await getConversationWithWalker(
    session.user.id,
    walkerProfileId
  );

  return NextResponse.json({ conversation });
}
