import { NextResponse } from "next/server";
import {
  getConversationDetail,
  requireAuthUser,
  sendMessage,
} from "@/lib/messages";
import { z } from "zod";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuthUser();
    const { id } = await params;
    const conversation = await getConversationDetail(id, user.id);

    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ conversation });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

const messageSchema = z.object({
  body: z.string().min(1).max(2000),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuthUser();
    const { id } = await params;
    const body = await request.json();
    const parsed = messageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    await sendMessage(id, user.id, parsed.data.body.trim());
    const conversation = await getConversationDetail(id, user.id);

    return NextResponse.json({ conversation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send";

    if (message === "Unauthorized") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message === "Conversation not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
