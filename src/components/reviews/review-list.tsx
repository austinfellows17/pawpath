import { Star } from "lucide-react";
import type { ReviewDisplay } from "@/lib/reviews";
import { cn } from "@/lib/utils";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn(
            "h-4 w-4",
            index < rating ? "fill-accent text-accent" : "text-sand-300"
          )}
        />
      ))}
    </div>
  );
}

export function ReviewList({ reviews }: { reviews: ReviewDisplay[] }) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-sand-600">
        No published reviews yet. Be the first to share your experience after
        messaging this walker.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <article
          key={review.id}
          className="rounded-2xl border border-sand-200/80 bg-sand-50/60 p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-trail-900">{review.authorLabel}</p>
              <p className="mt-1 text-xs text-sand-500">
                {new Date(review.createdAt).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <StarRating rating={review.rating} />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-sand-700">
            {review.body}
          </p>
        </article>
      ))}
    </div>
  );
}
