"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { ConversationSummary } from "@/lib/messages";

export function ConversationList({ embedded = false }: { embedded?: boolean }) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const response = await fetch("/api/conversations");
    if (response.ok) {
      const data = await response.json();
      setConversations(data.conversations);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-trail-600" />
      </div>
    );
  }

  if (conversations.length === 0) {
    if (embedded) return null;
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-sand-300 bg-sand-50 p-12 text-center">
        <p className="text-sand-600">No conversations yet.</p>
        <p className="mt-2 text-sm text-sand-500">
          Find a walker and send a message to get started.
        </p>
        <Link
          href="/find"
          className="mt-4 inline-block text-sm font-medium text-trail-700 hover:underline"
        >
          Browse walkers →
        </Link>
      </div>
    );
  }

  return (
    <div className={embedded ? "mt-4 space-y-3" : "mt-8 space-y-3"}>
      {conversations.map((conversation) => (
        <Link
          key={conversation.id}
          href={`/messages/${conversation.id}`}
          className="block rounded-2xl border border-sand-200 bg-white/80 p-4 transition hover:border-trail-300 hover:shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-trail-900">
                {conversation.otherUser.name ?? "PawPath user"}
              </p>
              <p className="text-xs text-sand-500">
                {conversation.otherUser.role === "WALKER"
                  ? "Dog walker"
                  : "Dog owner"}
              </p>
            </div>
            {conversation.lastMessage && (
              <p className="text-xs text-sand-500">
                {new Date(conversation.lastMessage.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
          {conversation.lastMessage ? (
            <p className="mt-2 line-clamp-2 text-sm text-sand-600">
              {conversation.lastMessage.isFromMe ? "You: " : ""}
              {conversation.lastMessage.body}
            </p>
          ) : (
            <p className="mt-2 text-sm text-sand-500">No messages yet</p>
          )}
        </Link>
      ))}
    </div>
  );
}
