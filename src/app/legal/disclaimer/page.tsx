import { LIABILITY_DISCLAIMER, PRICING_DISCLAIMER, APP_NAME } from "@/lib/constants";

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-trail-950">
        Liability Disclaimer
      </h1>

      <div className="mt-8 space-y-6 text-sand-700">
        <div className="rounded-2xl border border-sand-300 bg-sand-100 p-6">
          <p className="font-medium text-trail-900">{LIABILITY_DISCLAIMER}</p>
        </div>

        <section>
          <h2 className="font-display text-xl font-semibold text-trail-900">
            What this means for dog owners
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>You are responsible for vetting any walker you connect with</li>
            <li>{APP_NAME} does not conduct background checks unless a walker displays a verified badge (manual admin review)</li>
            <li>{APP_NAME} does not provide insurance for injuries, property damage, or lost pets</li>
            <li>Any payment disputes are between you and the walker</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-trail-900">
            What this means for dog walkers
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>You are an independent contractor, not a {APP_NAME} employee</li>
            <li>You are responsible for your own insurance, licensing, and tax obligations</li>
            <li>Listing on {APP_NAME} does not guarantee clients or income</li>
            <li>You set your own rates and payment methods directly with owners</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-trail-900">
            Pricing
          </h2>
          <p className="mt-3">{PRICING_DISCLAIMER}</p>
        </section>
      </div>
    </div>
  );
}
