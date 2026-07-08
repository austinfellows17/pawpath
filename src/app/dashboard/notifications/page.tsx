import Link from "next/link";
import { redirect } from "next/navigation";
import { NotificationSettingsForm } from "@/components/settings/notification-settings-form";
import { getSession } from "@/lib/session";
import { needsOnboarding } from "@/lib/onboarding";

export default async function NotificationSettingsPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/notifications");
  }

  if (await needsOnboarding(session.user.id, session.user.role)) {
    redirect("/onboarding");
  }

  return (
    <>
      <div className="hero-band border-b border-sand-200/50">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-14">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-trail-600 hover:text-trail-800"
          >
            ← Back to dashboard
          </Link>
          <p className="section-label mt-6">Stay in the loop</p>
          <h1 className="headline-lg mt-3">Notifications</h1>
          <p className="body-lg mt-3 max-w-xl">
            Choose how PawPath reaches you for new messages, verification
            updates, and support replies. Email and text can be used together or
            on their own.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="surface-card p-6 sm:p-8">
          <NotificationSettingsForm />
        </div>
      </div>
    </>
  );
}
