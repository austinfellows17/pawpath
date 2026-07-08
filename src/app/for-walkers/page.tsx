import { Button } from "@/components/ui/button";
import { DisclaimerBanner } from "@/components/legal/disclaimer-banner";
import { EditorialBand } from "@/components/visual/editorial-band";
import { PhotoHero } from "@/components/visual/photo-hero";
import { LISTING_TIERS } from "@/lib/constants";
import { SITE_IMAGES } from "@/lib/site-images";
import { Check } from "lucide-react";

export default function ForWalkersPage() {
  return (
    <>
      <PhotoHero
        image={SITE_IMAGES.delMarDogBeach.src}
        alt={SITE_IMAGES.delMarDogBeach.alt}
        label="For dog walkers"
        title={
          <>
            Get discovered locally —{" "}
            <span className="text-trail-200">without giving up 20% of every walk.</span>
          </>
        }
        description="PawPath is a listing platform, not a booking middleman. Owners find you, message you, and pay you directly. You invest in visibility — not transaction fees."
        imagePosition="right"
      >
        <Button
          href="/signup?role=walker"
          size="lg"
          className="bg-white text-trail-800 shadow-lift hover:bg-trail-50"
        >
          Create your listing
        </Button>
      </PhotoHero>

      <EditorialBand
        image={SITE_IMAGES.trailWalk.src}
        alt={SITE_IMAGES.trailWalk.alt}
        label="Your daily route"
        title="Show owners the walks you already know."
        description="Your listing highlights the neighborhoods you serve, the services you offer, and the experience you bring — so the right owners find you without a national marketplace in the middle."
        className="pb-0"
      />

    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {(Object.entries(LISTING_TIERS) as [keyof typeof LISTING_TIERS, typeof LISTING_TIERS[keyof typeof LISTING_TIERS]][]).map(
          ([tier, info]) => (
            <div
              key={tier}
              className={`surface-card p-7 ${
                tier === "STANDARD" ? "ring-2 ring-trail-200/80 shadow-glow" : ""
              }`}
            >
              <p className="text-sm font-medium uppercase tracking-wide text-trail-600">
                {info.label}
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-trail-950">
                {info.priceLabel}
              </p>
              <p className="mt-2 text-sm text-sand-700">{info.description}</p>
              <ul className="mt-4 space-y-2">
                {info.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-trail-800"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-trail-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {tier === "BASIC" ? (
                  <Button href="/signup?role=walker" variant="outline" className="w-full">
                    Get started free
                  </Button>
                ) : (
                  <Button href="/dashboard/billing" className="w-full">
                    Choose {info.label}
                  </Button>
                )}
              </div>
            </div>
          )
        )}
      </div>

      <div className="mt-16 rounded-2xl border border-sand-200 bg-white/60 p-8">
        <h2 className="font-display text-2xl font-semibold text-trail-950">
          How listing works
        </h2>
        <ol className="mt-6 space-y-4 text-sand-700">
          <li>
            <strong className="text-trail-900">1. Create your profile</strong>{" "}
            — bio, services, informational rates, and your service area.
          </li>
          <li>
            <strong className="text-trail-900">2. Get verified</strong> — submit
            ID for manual admin review. Verified walkers earn trust with owners.
          </li>
          <li>
            <strong className="text-trail-900">3. Choose a tier</strong> — higher
            tiers get better placement in search and on the map.
          </li>
          <li>
            <strong className="text-trail-900">4. Connect offline</strong> — when
            an owner messages you, share contact info and schedule directly.
            PawPath never takes a cut.
          </li>
        </ol>
      </div>

      <div className="mt-8">
        <DisclaimerBanner>
          PawPath does not employ walkers, provide insurance, or mediate
          disputes. You are an independent service provider listing your
          services on our platform.
        </DisclaimerBanner>
      </div>
    </div>
    </>
  );
}
