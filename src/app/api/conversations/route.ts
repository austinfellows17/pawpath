import { NextResponse } from "next/server";
import {
  getConversationsForUser,
  requireAuthUser,
  startConversationWithWalker,
} from "@/lib/messages";
import { z } from "zod";

export async function GET() {
  try {
    const user = await requireAuthUser();
    const conversations = await getConversationsForUser(user.id);
    return NextResponse.json({ conversations });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

const createSchema = z.object({
  walkerProfileId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const user = await requireAuthUser();

    if (user.role !== "OWNER") {
      return NextResponse.json(
        { error: "Only dog owners can start conversations" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const conversation = await startConversationWithWalker(
      user.id,
      parsed.data.walkerProfileId
    );

    return NextResponse.json({ conversationId: conversation.id });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start conversation";

    if (message === "Unauthorized") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message === "Walker not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
