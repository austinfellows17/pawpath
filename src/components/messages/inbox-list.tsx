"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { ConversationList } from "@/components/messages/conversation-list";
import type { ReviewInquirySummary } from "@/lib/review-inquiries";

function ReviewInquiryList() {
  const [inquiries, setInquiries] = useState<ReviewInquirySummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const response = await fetch("/api/review-inquiries");
    if (response.ok) {
      const data = await response.json();
      setInquiries(data.inquiries);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || inquiries.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="font-medium text-trail-900">PawPath support</h2>
      <p className="mt-1 text-sm text-sand-600">
        Questions about reviews you&apos;ve submitted.
      </p>
      <div className="mt-4 space-y-3">
        {inquiries.map((inquiry) => (
          <Link
            key={inquiry.id}
            href={`/messages/inquiry/${inquiry.id}`}
            className="block rounded-2xl border border-trail-200 bg-trail-50/70 p-4 transition hover:border-trail-300 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-trail-900">{inquiry.subject}</p>
                <p className="text-xs text-trail-600">PawPath Admin</p>
              </div>
              {inquiry.lastMessage && (
                <p className="text-xs text-sand-500">
                  {new Date(inquiry.lastMessage.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
            {inquiry.lastMessage ? (
              <p className="mt-2 line-clamp-2 text-sm text-sand-600">
                {inquiry.lastMessage.isFromMe ? "You: " : "Admin: "}
                {inquiry.lastMessage.body}
              </p>
            ) : (
              <p className="mt-2 text-sm text-sand-500">No messages yet</p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

export function MessagesInbox() {
  const [loading, setLoading] = useState(true);
  const [hasInquiries, setHasInquiries] = useState(false);
  const [hasConversations, setHasConversations] = useState(false);

  const load = useCallback(async () => {
    const [inquiriesRes, conversationsRes] = await Promise.all([
      fetch("/api/review-inquiries"),
      fetch("/api/conversations"),
    ]);

    if (inquiriesRes.ok) {
      const data = await inquiriesRes.json();
      setHasInquiries(data.inquiries.length > 0);
    }

    if (conversationsRes.ok) {
      const data = await conversationsRes.json();
      setHasConversations(data.conversations.length > 0);
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

  if (!hasInquiries && !hasConversations) {
    return (
      <div className="rounded-2xl border border-dashed border-sand-300 bg-sand-50 p-12 text-center">
        <p className="text-sand-600">No messages yet.</p>
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
    <div className="space-y-10">
      <ReviewInquiryList />
      {hasConversations && (
        <section>
          <h2 className="font-medium text-trail-900">Walker conversations</h2>
          <ConversationList embedded />
        </section>
      )}
    </div>
  );
}
