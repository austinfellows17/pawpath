import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { needsOnboarding } from "@/lib/onboarding";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (await needsOnboarding(session.user.id, session.user.role)) {
    redirect("/onboarding");
  }

  const { role, name } = session.user;

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
                description="Update your bio, services, rates, and photos."
                href="/onboarding"
              />
            <DashboardCard
              title="Listing tier"
              description="Upgrade visibility in local search."
              href="/dashboard/billing"
            />
              <DashboardCard
                title="Messages"
                description="Respond to dog owners who reached out."
                href="/messages"
              />
              <DashboardCard
                title="Verification"
                description="Submit ID for admin review."
                href="/onboarding?step=verification"
              />
            </>
          )}

          {role === "ADMIN" && (
            <DashboardCard
              title="Admin panel"
              description="Review verifications and moderate reviews."
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
