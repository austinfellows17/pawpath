"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ReviewQueueItem } from "@/lib/reviews";
import { ReviewInquiryPanel } from "@/components/admin/review-inquiry-panel";

export function ReviewQueue({
  initialReviews,
}: {
  initialReviews: ReviewQueueItem[];
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleModerate(id: string, action: "approve" | "reject") {
    setBusyId(id);

    const response = await fetch(`/api/admin/reviews/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        notes: action === "reject" ? notes || undefined : undefined,
      }),
    });

    if (response.ok) {
      setReviews((prev) => prev.filter((review) => review.id !== id));
      setRejectingId(null);
      setNotes("");
    }

    setBusyId(null);
  }

  if (reviews.length === 0) {
    return (
      <p className="mt-4 text-sm text-sand-600">
        No pending reviews right now.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {reviews.map((review) => (
        <div key={review.id} className="surface-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{review.rating} ★</Badge>
                <span className="text-sm text-sand-600">
                  {review.authorName} →{" "}
                  <Link
                    href={`/walkers/${review.walkerProfileId}`}
                    className="font-medium text-trail-700 hover:underline"
                  >
                    {review.walkerName}
                  </Link>
                </span>
              </div>
              <p className="mt-1 text-xs text-sand-500">{review.authorEmail}</p>
              <p className="mt-3 text-sm leading-relaxed text-sand-700">
                {review.body}
              </p>
              <p className="mt-2 text-xs text-sand-500">
                Submitted{" "}
                {new Date(review.submittedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleModerate(review.id, "approve")}
                disabled={busyId === review.id}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setRejectingId(rejectingId === review.id ? null : review.id)
                }
                disabled={busyId === review.id}
              >
                Reject
              </Button>
            </div>
          </div>

          {rejectingId === review.id && (
            <div className="mt-3 border-t border-sand-200 pt-3">
              <label className="text-xs font-medium text-sand-700">
                Internal note (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-sand-300 px-3 py-2 text-sm focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
                placeholder="Reason for rejection (internal only)"
              />
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleModerate(review.id, "reject")}
                  disabled={busyId === review.id}
                >
                  Confirm rejection
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setRejectingId(null);
                    setNotes("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <ReviewInquiryPanel reviewId={review.id} authorName={review.authorName} />
        </div>
      ))}
    </div>
  );
}
