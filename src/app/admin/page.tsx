import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { VerificationQueue } from "@/components/admin/verification-queue";
import { ReviewQueue } from "@/components/admin/review-queue";
import { ListingReviewQueue } from "@/components/admin/listing-review-queue";
import { CredentialsQueue } from "@/components/admin/credentials-queue";
import { ProfileReportsQueue } from "@/components/admin/profile-reports-queue";
import { getPendingVerifications } from "@/lib/verification";
import { getPendingListingReviews } from "@/lib/listing-review";
import { getPendingCredentials } from "@/lib/credentials";
import { getPendingProfileReports } from "@/lib/profile-reports";
import { getPendingReviews } from "@/lib/reviews";

export default async function AdminPage() {
  const session = await getSession();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [
    pendingListings,
    pendingCredentials,
    pendingReports,
    pendingVerifications,
    pendingReviews,
  ] = await Promise.all([
    getPendingListingReviews(),
    getPendingCredentials(),
    getPendingProfileReports(),
    getPendingVerifications(),
    getPendingReviews(),
  ]);

  return (
    <>
      <div className="hero-band border-b border-sand-200/50">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-14">
          <p className="section-label">Administration</p>
          <h1 className="headline-lg mt-3">Admin</h1>
          <p className="body-lg mt-3">
            Review walker applications, Pro credentials, profile reports, and
            user reviews.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <section className="mt-2">
          <h2 className="font-display text-lg font-semibold text-trail-950">
            Pending walker applications ({pendingListings.length})
          </h2>
          <p className="mt-1 text-sm text-sand-600">
            Includes new applications and re-reviews after bio or headshot
            changes.
          </p>
          <ListingReviewQueue initialListings={pendingListings} />
        </section>

        <section className="mt-10">
          <h2 className="font-display text-lg font-semibold text-trail-950">
            Profile reports ({pendingReports.length})
          </h2>
          <ProfileReportsQueue initialReports={pendingReports} />
        </section>

        <section className="mt-10">
          <h2 className="font-display text-lg font-semibold text-trail-950">
            Pending Pro credentials ({pendingCredentials.length})
          </h2>
          <CredentialsQueue initialCredentials={pendingCredentials} />
        </section>

        <section className="mt-10">
          <h2 className="font-display text-lg font-semibold text-trail-950">
            Pending ID-only verifications ({pendingVerifications.length})
          </h2>
          <VerificationQueue initialVerifications={pendingVerifications} />
        </section>

        <section className="mt-10">
          <h2 className="font-display text-lg font-semibold text-trail-950">
            Pending reviews ({pendingReviews.length})
          </h2>
          <ReviewQueue initialReviews={pendingReviews} />
        </section>
      </div>
    </>
  );
}
