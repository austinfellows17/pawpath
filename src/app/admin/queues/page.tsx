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

export default async function AdminQueuesPage() {
  const session = await getSession();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

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
    <div className="space-y-10">
      <section>
        <h2 className="font-display text-lg font-semibold text-trail-950">
          Pending walker applications ({pendingListings.length})
        </h2>
        <ListingReviewQueue initialListings={pendingListings} />
      </section>
      <section>
        <h2 className="font-display text-lg font-semibold text-trail-950">
          Profile reports ({pendingReports.length})
        </h2>
        <ProfileReportsQueue initialReports={pendingReports} />
      </section>
      <section>
        <h2 className="font-display text-lg font-semibold text-trail-950">
          Pending Pro credentials ({pendingCredentials.length})
        </h2>
        <CredentialsQueue initialCredentials={pendingCredentials} />
      </section>
      <section>
        <h2 className="font-display text-lg font-semibold text-trail-950">
          Pending ID-only verifications ({pendingVerifications.length})
        </h2>
        <VerificationQueue initialVerifications={pendingVerifications} />
      </section>
      <section>
        <h2 className="font-display text-lg font-semibold text-trail-950">
          Pending reviews ({pendingReviews.length})
        </h2>
        <ReviewQueue initialReviews={pendingReviews} />
      </section>
    </div>
  );
}
