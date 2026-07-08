import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { VerificationQueue } from "@/components/admin/verification-queue";
import { ReviewQueue } from "@/components/admin/review-queue";
import { getPendingVerifications } from "@/lib/verification";
import { getPendingReviews } from "@/lib/reviews";

export default async function AdminPage() {
  const session = await getSession();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [pendingVerifications, pendingReviews] = await Promise.all([
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
            Review walker verifications and moderate user reviews.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <section className="mt-2">
          <h2 className="font-display text-lg font-semibold text-trail-950">
            Pending verifications ({pendingVerifications.length})
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
