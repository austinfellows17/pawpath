"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type InquiryMessage = {
  id: string;
  body: string;
  senderName: string;
  createdAt: string;
  isFromMe: boolean;
};

export function ReviewInquiryPanel({
  reviewId,
  authorName,
}: {
  reviewId: string;
  authorName: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<InquiryMessage[]>([]);
  const [inquiryId, setInquiryId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadInquiry = useCallback(async () => {
    setLoading(true);
    setError("");

    const response = await fetch(`/api/admin/reviews/${reviewId}/inquiry`);
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Failed to load inquiry");
      setLoading(false);
      return;
    }

    setMessages(data.inquiry?.messages ?? []);
    setInquiryId(data.inquiry?.id ?? null);
    setLoading(false);
  }, [reviewId]);

  useEffect(() => {
    if (open) {
      loadInquiry();
    }
  }, [open, loadInquiry]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;

    setSending(true);
    setError("");

    const response = await fetch(`/api/admin/reviews/${reviewId}/inquiry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: draft.trim() }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Failed to send message");
      setSending(false);
      return;
    }

    setMessages(data.inquiry?.messages ?? []);
    setInquiryId(data.inquiry?.id ?? null);
    setDraft("");
    setSending(false);
  }

  return (
    <div className="mt-4 border-t border-sand-200 pt-4">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen(!open)}
      >
        {open ? "Hide messages" : `Message ${authorName.split(" ")[0]}`}
      </Button>

      {open && (
        <div className="mt-4 rounded-2xl border border-sand-200 bg-sand-50/70 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-sand-500">
            Review clarification thread
          </p>
          <p className="mt-1 text-sm text-sand-600">
            Ask {authorName} follow-up questions before approving or rejecting.
            They&apos;ll see this in their Messages inbox.
          </p>
          {inquiryId && (
            <Link
              href={`/messages/inquiry/${inquiryId}`}
              className="mt-2 inline-block text-sm font-medium text-trail-700 hover:underline"
            >
              Open full thread →
            </Link>
          )}

          {loading ? (
            <p className="mt-4 text-sm text-sand-600">Loading thread...</p>
          ) : (
            <>
              <div className="mt-4 max-h-64 space-y-3 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-sm text-sand-600">
                    No messages yet. Send the first question below.
                  </p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-2xl px-4 py-3 text-sm ${
                        message.isFromMe
                          ? "ml-8 bg-trail-700 text-white"
                          : "mr-8 bg-white text-trail-900"
                      }`}
                    >
                      <p className="text-xs font-medium opacity-80">
                        {message.senderName}
                      </p>
                      <p className="mt-1 leading-relaxed">{message.body}</p>
                      <p className="mt-2 text-[11px] opacity-70">
                        {new Date(message.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSend} className="mt-4 space-y-3">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={3}
                  placeholder="Ask a clarifying question about this review..."
                  className="w-full rounded-xl border border-sand-300 bg-white px-4 py-2.5 text-sm focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" size="sm" disabled={sending || !draft.trim()}>
                  {sending ? "Sending..." : "Send message"}
                </Button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
