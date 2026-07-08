import { LIABILITY_DISCLAIMER, PRICING_DISCLAIMER, APP_NAME } from "@/lib/constants";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-trail-950">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-sand-600">
        Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
      </p>

      <div className="prose prose-stone mt-8 max-w-none space-y-6 text-sand-700">
        <section>
          <h2 className="font-display text-xl font-semibold text-trail-900">
            1. Platform nature
          </h2>
          <p>
            {APP_NAME} is a local discovery and connection platform that helps
            dog owners find dog walkers in their area. {APP_NAME} is not a pet
            care service provider, employer, booking agent, payment processor, or
            insurer.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-trail-900">
            2. No employment or agency relationship
          </h2>
          <p>
            Dog walkers listed on {APP_NAME} are independent service providers.
            {APP_NAME} does not employ, supervise, or control walkers. Any
            arrangement for dog walking services is solely between the dog owner
            and the walker.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-trail-900">
            3. Payments
          </h2>
          <p>{PRICING_DISCLAIMER}</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-trail-900">
            4. Liability
          </h2>
          <p>{LIABILITY_DISCLAIMER}</p>
          <p className="mt-3">
            You agree that {APP_NAME}, its operators, and affiliates shall not be
            liable for any injury, loss, damage, or dispute arising from services
            arranged through connections made on the platform.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-trail-900">
            5. Walker listings
          </h2>
          <p>
            Walkers may pay for enhanced listing visibility on {APP_NAME}. Listing
            fees are for advertising placement only and do not constitute an
            endorsement, guarantee, or warranty of any walker&apos;s services.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-trail-900">
            6. Reviews
          </h2>
          <p>
            Reviews are user-generated content moderated by {APP_NAME} administrators.
            Reviews represent individual opinions and do not constitute {APP_NAME}
            endorsements.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-trail-900">
            7. Contact information
          </h2>
          <p>
            Walker contact information is revealed to dog owners only after the
            owner initiates a message. Users agree to use contact information
            responsibly and only for arranging dog walking services.
          </p>
        </section>
      </div>
    </div>
  );
}
