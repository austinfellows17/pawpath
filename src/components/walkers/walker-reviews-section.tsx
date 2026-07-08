import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewList } from "@/components/reviews/review-list";
import {
  getApprovedReviews,
  getOwnerReviewState,
} from "@/lib/reviews";

export async function WalkerReviewsSection({
  walkerProfileId,
  walkerName,
}: {
  walkerProfileId: string;
  walkerName: string;
}) {
  const session = await getServerSession(authOptions);
  const [reviews, reviewState] = await Promise.all([
    getApprovedReviews(walkerProfileId),
    getOwnerReviewState(session?.user?.id, walkerProfileId),
  ]);

  const showForm =
    reviewState.canSubmit ||
    reviewState.reason === "not_logged_in" ||
    reviewState.reason === "no_conversation" ||
    reviewState.reason === "already_reviewed";

  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-semibold text-trail-950">
        Reviews
      </h2>
      <p className="mt-2 text-sm text-sand-600">
        Reviews from dog owners who connected with {walkerName} through PawPath.
      </p>

      <div className="mt-6">
        <ReviewList reviews={reviews} />
      </div>

      {showForm && (
        <div className="mt-8 border-t border-sand-200 pt-8">
          <h3 className="font-medium text-trail-900">Leave a review</h3>
          <p className="mt-1 text-sm text-sand-600">
            Share your experience after messaging this walker. All reviews are
            moderated before publishing.
          </p>
          <div className="mt-4">
            <ReviewForm
              walkerProfileId={walkerProfileId}
              walkerName={walkerName}
              reviewState={reviewState}
            />
          </div>
        </div>
      )}
    </section>
  );
}
