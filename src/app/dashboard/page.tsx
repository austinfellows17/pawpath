import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { needsOnboarding, getWalkerDashboardStatus } from "@/lib/onboarding";
import { EmailVerificationBanner } from "@/components/auth/email-verification-banner";
import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (await needsOnboarding(session.user.id, session.user.role)) {
    redirect("/onboarding");
  }

  const { role, name } = session.user;
  const walkerStatus =
    role === "WALKER"
      ? await getWalkerDashboardStatus(session.user.id)
      : null;

  return (
    <>
      <div className="hero-band border-b border-sand-200/50">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="section-label">Dashboard</p>
          <h1 className="headline-lg mt-3">
            Welcome{name ? `, ${name.split(" ")[0]}` : ""}
          </h1>
          <p className="body-lg mt-3 max-w-xl">
            {role === "WALKER"
              ? "Manage your listing, messages, and tier."
              : role === "ADMIN"
                ? "Admin dashboard"
                : "Find walkers and manage your messages."}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <EmailVerificationBanner />
        {walkerStatus?.listingReviewStatus === "PENDING" && (
          <div className="mb-6 flex gap-3 rounded-2xl border border-sand-300 bg-sand-100 p-5">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-trail-700" />
            <div>
              <p className="font-medium text-trail-900">Application under review</p>
              <p className="mt-1 text-sm text-sand-700">
                Your listing won&apos;t appear in search until an admin approves
                it. This usually takes 1–2 business days.
                {walkerStatus.listingSubmittedAt && (
                  <>
                    {" "}
                    Submitted{" "}
                    {new Date(walkerStatus.listingSubmittedAt).toLocaleDateString()}.
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        {walkerStatus?.listingReviewStatus === "REJECTED" && (
          <div className="mb-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-5">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
            <div>
              <p className="font-medium text-red-900">Application needs changes</p>
              {walkerStatus.listingReviewNotes && (
                <p className="mt-1 text-sm text-red-800">
                  {walkerStatus.listingReviewNotes}
                </p>
              )}
              <Link
                href="/onboarding?step=submit"
                className="mt-2 inline-block text-sm font-medium text-red-900 underline"
              >
                Update and resubmit your application
              </Link>
            </div>
          </div>
        )}

        {walkerStatus?.listingReviewStatus === "APPROVED" &&
          walkerStatus.isActive && (
            <div className="mb-6 flex gap-3 rounded-2xl border border-trail-200 bg-trail-50 p-5">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-trail-700" />
              <div>
                <p className="font-medium text-trail-900">Your listing is live</p>
                <p className="mt-1 text-sm text-trail-700">
                  Dog owners in your area can find and message you.
                </p>
              </div>
            </div>
          )}

        <div className="grid gap-4 sm:grid-cols-2">
          <DashboardCard
            title="Notifications"
            description="Choose email, text, or both for alerts."
            href="/dashboard/notifications"
          />
          {role === "OWNER" && (
            <>
              <DashboardCard
                title="Find walkers"
                description="Search by zip code and map near you."
                href="/find"
              />
              <DashboardCard
                title="Complete your profile"
                description="Add your dog info and location for better matches."
                href="/onboarding"
              />
              <DashboardCard
                title="Messages"
                description="View conversations with walkers."
                href="/messages"
              />
            </>
          )}

          {role === "WALKER" && (
            <>
              <DashboardCard
                title="Edit listing"
                description="Update your bio, services, rates, and headshot."
                href="/onboarding"
              />
              <DashboardCard
                title="Listing tier"
                description="Upgrade visibility in local search."
                href="/dashboard/billing"
              />
              <DashboardCard
                title="Pro credentials"
                description="Upload insurance or certification for a Pro badge."
                href="/onboarding?step=credentials"
              />
              <DashboardCard
                title="Messages"
                description="Respond to dog owners who reached out."
                href="/messages"
              />
            </>
          )}

          {role === "ADMIN" && (
            <DashboardCard
              title="Admin panel"
              description="Live metrics, users, background checks, and moderation."
              href="/admin"
            />
          )}
        </div>
      </div>
    </>
  );
}

function DashboardCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href} className="surface-card block p-6 no-underline">
      <h2 className="font-semibold tracking-tight text-trail-900">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-sand-600">
        {description}
      </p>
    </Link>
  );
}
