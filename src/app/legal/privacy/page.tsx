import { APP_NAME } from "@/lib/constants";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-trail-950">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-sand-600">
        Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
      </p>

      <div className="mt-8 space-y-6 text-sand-700">
        <section>
          <h2 className="font-display text-xl font-semibold text-trail-900">
            Information we collect
          </h2>
          <p className="mt-2">
            {APP_NAME} collects account information (name, email), profile data
            (location, dog info for owners; services and bio for walkers), and
            messages sent through the platform.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-trail-900">
            Contact information sharing
          </h2>
          <p className="mt-2">
            Walker phone numbers and email addresses are not displayed publicly.
            They are shared with a dog owner only after the owner sends an
            initial message to the walker.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-trail-900">
            Location data
          </h2>
          <p className="mt-2">
            We use zip codes and coordinates to match owners with nearby walkers.
            Exact addresses are not required or displayed on public profiles.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-trail-900">
            Third-party services
          </h2>
          <p className="mt-2">
            We use third-party services for authentication (Google), maps
            (Mapbox), and walker listing payments (Stripe). These services have
            their own privacy policies.
          </p>
        </section>
      </div>
    </div>
  );
}
