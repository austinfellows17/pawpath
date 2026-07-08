"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { OwnerReviewState } from "@/lib/reviews";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReviewForm({
  walkerProfileId,
  walkerName,
  reviewState,
}: {
  walkerProfileId: string;
  walkerName: string;
  reviewState: OwnerReviewState;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(
    reviewState.canSubmit && reviewState.existingReview
      ? reviewState.existingReview.rating
      : 5
  );
  const [body, setBody] = useState(
    reviewState.canSubmit && reviewState.existingReview
      ? reviewState.existingReview.body
      : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!reviewState.canSubmit) {
    if (reviewState.reason === "not_logged_in") {
      return (
        <p className="text-sm text-sand-600">
          <Link
            href={`/login?callbackUrl=/walkers/${walkerProfileId}`}
            className="font-medium text-trail-700 hover:underline"
          >
            Log in
          </Link>{" "}
          to leave a review after messaging {walkerName}.
        </p>
      );
    }

    if (reviewState.reason === "not_owner") {
      return null;
    }

    if (reviewState.reason === "no_conversation") {
      return (
        <p className="text-sm text-sand-600">
          Message {walkerName} first, then come back to share your experience.
        </p>
      );
    }

    if (reviewState.reason === "already_reviewed") {
      return (
        <p className="text-sm text-sand-600">
          You&apos;ve already reviewed {walkerName}. Thanks for sharing your
          experience.
        </p>
      );
    }

    return null;
  }

  if (
    reviewState.existingReview?.status === "PENDING" &&
    submitted === false &&
    !loading
  ) {
    // Allow editing pending review - show form with message
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walkerProfileId, rating, body }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Failed to submit review");
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
    router.refresh();
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-trail-200 bg-trail-50 p-5">
        <p className="font-medium text-trail-900">Review submitted</p>
        <p className="mt-2 text-sm text-trail-700">
          Thanks for sharing your experience. Your review is pending admin
          moderation and will appear on {walkerName}&apos;s profile once
          approved.
        </p>
      </div>
    );
  }

  const isPendingUpdate = reviewState.existingReview?.status === "PENDING";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isPendingUpdate && (
        <p className="rounded-xl bg-sand-100 px-4 py-3 text-sm text-sand-700">
          Your review is pending moderation. You can update it below before it
          is approved.
        </p>
      )}

      <div>
        <label className="text-sm font-medium text-trail-800">Rating</label>
        <div className="mt-2 flex gap-1">
          {Array.from({ length: 5 }).map((_, index) => {
            const value = index + 1;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className="rounded-lg p-1 transition hover:bg-sand-100"
                aria-label={`Rate ${value} stars`}
              >
                <Star
                  className={cn(
                    "h-6 w-6",
                    value <= rating
                      ? "fill-accent text-accent"
                      : "text-sand-300"
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor="review-body" className="text-sm font-medium text-trail-800">
          Your review
        </label>
        <textarea
          id="review-body"
          required
          rows={4}
          minLength={20}
          maxLength={2000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={`Share your experience walking with ${walkerName}...`}
          className="mt-1 w-full rounded-xl border border-sand-300 px-4 py-2.5 text-sm focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
        />
        <p className="mt-1 text-xs text-sand-500">
          Minimum 20 characters. Reviews are moderated before publishing.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading
          ? "Submitting..."
          : isPendingUpdate
            ? "Update review"
            : "Submit review"}
      </Button>
    </form>
  );
}
