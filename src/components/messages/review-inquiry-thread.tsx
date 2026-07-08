"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { ReviewInquiryDetail } from "@/lib/review-inquiries";

export function ReviewInquiryThread({ inquiryId }: { inquiryId: string }) {
  const [inquiry, setInquiry] = useState<ReviewInquiryDetail | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadInquiry = useCallback(async () => {
    const response = await fetch(`/api/review-inquiries/${inquiryId}`);
    const data = await response.json();

    if (response.ok) {
      setInquiry(data.inquiry);
    }

    setLoading(false);
  }, [inquiryId]);

  useEffect(() => {
    loadInquiry();
  }, [loadInquiry]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;

    setSending(true);
    setError("");

    const response = await fetch(`/api/review-inquiries/${inquiryId}`, {
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

    setInquiry(data.inquiry);
    setDraft("");
    setSending(false);
  }

  if (loading) {
    return <p className="py-16 text-center text-sand-600">Loading...</p>;
  }

  if (!inquiry) {
    return (
      <p className="py-16 text-center text-sand-600">
        Inquiry not found or you don&apos;t have access.
      </p>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col">
      <Link
        href="/messages"
        className="text-sm font-medium text-trail-600 hover:text-trail-800"
      >
        ← Back to messages
      </Link>

      <div className="mt-6">
        <p className="section-label">PawPath support</p>
        <h1 className="headline-lg mt-2">{inquiry.subject}</h1>
        <p className="mt-2 text-sm text-sand-600">
          About your review of {inquiry.walkerName}
        </p>
        <p className="mt-3 rounded-xl bg-sand-100 px-4 py-3 text-sm italic text-sand-700">
          &ldquo;{inquiry.reviewExcerpt}
          {inquiry.reviewExcerpt.length >= 160 ? "..." : ""}&rdquo;
        </p>
      </div>

      <div className="mt-8 flex-1 space-y-3 overflow-y-auto">
        {inquiry.messages.length === 0 ? (
          <p className="text-sm text-sand-600">No messages yet.</p>
        ) : (
          inquiry.messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                message.isFromMe
                  ? "ml-auto bg-trail-700 text-white"
                  : "bg-white text-trail-900 shadow-soft"
              }`}
            >
              <p className="text-xs font-medium opacity-80">{message.senderName}</p>
              <p className="mt-1 leading-relaxed">{message.body}</p>
              <p className="mt-2 text-[11px] opacity-70">
                {new Date(message.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSend} className="mt-6 border-t border-sand-200 pt-6">
        <label htmlFor="inquiry-reply" className="text-sm font-medium text-trail-800">
          Reply
        </label>
        <textarea
          id="inquiry-reply"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Write your reply..."
          className="mt-2 w-full rounded-xl border border-sand-300 px-4 py-2.5 text-sm focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <Button type="submit" className="mt-3" disabled={sending || !draft.trim()}>
          {sending ? "Sending..." : "Send reply"}
        </Button>
      </form>
    </div>
  );
}
