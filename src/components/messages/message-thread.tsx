"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DisclaimerBanner } from "@/components/legal/disclaimer-banner";
import { PRICING_DISCLAIMER } from "@/lib/constants";
import type { ConversationDetail } from "@/lib/messages";
import { ArrowLeft, Loader2, Mail, Phone, Send } from "lucide-react";

export function MessageThread({ conversationId }: { conversationId: string }) {
  const [conversation, setConversation] = useState<ConversationDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await fetch(`/api/conversations/${conversationId}`);
    if (response.ok) {
      const data = await response.json();
      setConversation(data.conversation);
    }
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    setSending(true);
    setError("");

    const response = await fetch(`/api/conversations/${conversationId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });

    if (!response.ok) {
      setError("Failed to send message");
      setSending(false);
      return;
    }

    const data = await response.json();
    setConversation(data.conversation);
    setBody("");
    setSending(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-trail-600" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <p className="py-16 text-center text-sand-600">Conversation not found.</p>
    );
  }

  return (
    <div>
      <Link
        href="/messages"
        className="inline-flex items-center gap-1 text-sm text-trail-600 hover:text-trail-800"
      >
        <ArrowLeft className="h-4 w-4" />
        All messages
      </Link>

      <div className="mt-4 rounded-2xl border border-sand-200 bg-white/80">
        <div className="border-b border-sand-200 px-4 py-4">
          <h2 className="font-display text-xl font-semibold text-trail-950">
            {conversation.otherUser.name ?? "PawPath user"}
          </h2>
          <p className="text-sm text-sand-600">
            {conversation.otherUser.role === "WALKER"
              ? "Take scheduling and payment offline once you connect."
              : "Reply to help this owner get started."}
          </p>
        </div>

        <div className="max-h-[420px] space-y-3 overflow-y-auto px-4 py-4">
          {conversation.messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-sand-500">
              Send the first message to start the conversation.
            </p>
          ) : (
            conversation.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isFromMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    message.isFromMe
                      ? "bg-trail-700 text-white"
                      : "bg-sand-100 text-trail-900"
                  }`}
                >
                  <p>{message.body}</p>
                  <p
                    className={`mt-1 text-xs ${
                      message.isFromMe ? "text-trail-200" : "text-sand-500"
                    }`}
                  >
                    {new Date(message.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {conversation.walkerContact && (
          <div className="border-t border-sand-200 bg-trail-50 px-4 py-4">
            <p className="text-sm font-medium text-trail-900">
              Walker contact info
            </p>
            <p className="mt-1 text-xs text-trail-700">
              Shared because you reached out. Schedule and pay directly offline.
            </p>
            <div className="mt-3 space-y-2 text-sm text-trail-800">
              {conversation.walkerContact.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {conversation.walkerContact.phone}
                </p>
              )}
              {conversation.walkerContact.email && (
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {conversation.walkerContact.email}
                </p>
              )}
            </div>
          </div>
        )}

        <form
          onSubmit={handleSend}
          className="border-t border-sand-200 px-4 py-4"
        >
          <div className="flex gap-2">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write a message..."
              className="flex-1 rounded-xl border border-sand-300 px-4 py-2.5 text-sm focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
            />
            <Button type="submit" disabled={sending || !body.trim()}>
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </form>
      </div>

      <div className="mt-6">
        <DisclaimerBanner compact>{PRICING_DISCLAIMER}</DisclaimerBanner>
      </div>
    </div>
  );
}
