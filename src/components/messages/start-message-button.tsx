"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageCircle, Loader2 } from "lucide-react";

export function StartMessageButton({
  walkerProfileId,
  walkerName,
  existingConversationId,
}: {
  walkerProfileId: string;
  walkerName: string;
  existingConversationId?: string | null;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (status === "loading") {
    return (
      <Button className="w-full" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (!session) {
    return (
      <Button href={`/login?callbackUrl=/walkers/${walkerProfileId}`} className="w-full">
        <MessageCircle className="mr-2 h-4 w-4" />
        Log in to message
      </Button>
    );
  }

  if (session.user.role !== "OWNER") {
    return (
      <Button href="/messages" variant="outline" className="w-full">
        <MessageCircle className="mr-2 h-4 w-4" />
        View your messages
      </Button>
    );
  }

  async function handleClick() {
    if (existingConversationId) {
      router.push(`/messages/${existingConversationId}`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walkerProfileId }),
      });

      if (!response.ok) throw new Error("Failed to start conversation");

      const data = await response.json();
      router.push(`/messages/${data.conversationId}`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <Button className="w-full" onClick={handleClick} disabled={loading}>
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <MessageCircle className="mr-2 h-4 w-4" />
      )}
      {existingConversationId
        ? `Continue chatting with ${walkerName.split(" ")[0]}`
        : `Message ${walkerName.split(" ")[0]}`}
    </Button>
  );
}
