import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { MessageThread } from "@/components/messages/message-thread";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <MessageThread conversationId={id} />
    </div>
  );
}
