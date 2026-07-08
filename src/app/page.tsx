import { Button } from "@/components/ui/button";
import { DisclaimerBanner } from "@/components/legal/disclaimer-banner";
import { FeatureCard } from "@/components/ui/section";
import { EditorialBand, PhotoCtaBand } from "@/components/visual/editorial-band";
import { PhotoHero } from "@/components/visual/photo-hero";
import { WalkerCard } from "@/components/walkers/walker-card";
import { TAGLINE } from "@/lib/constants";
import { SITE_IMAGES } from "@/lib/site-images";
import { getFeaturedWalkers } from "@/lib/walkers";
import {
  ArrowRight,
  MessageCircle,
  MapPin,
  HandCoins,
  ShieldOff,
} from "lucide-react";
import Link from "next/link";

export default async function HomePage() {
  const featuredWalkers = await getFeaturedWalkers(3);

  return (
    <>
      <PhotoHero
        image={SITE_IMAGES.heroBeachSunset.src}
        alt={SITE_IMAGES.heroBeachSunset.alt}
        label="Local dog walking"
        title={
          <>
            Find your neighborhood dog walker.{" "}
            <span className="text-trail-200">Skip the platform fees.</span>
          </>
        }
        description={`${TAGLINE} PawPath connects you with walkers nearby — then you message, schedule, and pay directly. No booking cut, no middleman.`}
        imagePosition="right"
      >
        <div className="flex flex-wrap gap-3">
          <Button
            href="/find"
            size="lg"
            className="bg-white text-trail-800 shadow-lift hover:bg-trail-50"
          >
            Find walkers near you
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            href="/for-walkers"
            variant="outline"
            size="lg"
            className="border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
          >
            I&apos;m a walker — get listed
          </Button>
        </div>
      </PhotoHero>

      <EditorialBand
        image={SITE_IMAGES.northCountyCoast.src}
        alt={SITE_IMAGES.northCountyCoast.alt}
        label="Your backyard"
        title="Built for your neighborhood."
        description="PawPath is designed around the places you actually walk your dog — hyperlocal connections, not a national marketplace."
      />

      {/* Feature bento */}
      <section className="section-pad bg-sand-50/80">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="section-label animate-fade-up">Why PawPath</p>
          <h2 className="headline-lg mt-3 max-w-xl animate-fade-up animate-fade-up-delay-1">
            Connection without the commission.
          </h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={MapPin}
              title="Hyperlocal"
              description="Match by zip code and map — walkers close to your dog."
              className="animate-fade-up animate-fade-up-delay-1"
            />
            <FeatureCard
              icon={MessageCircle}
              title="Connect, don't book"
              description="Message in-app, then take it offline to schedule."
              className="animate-fade-up animate-fade-up-delay-2"
            />
            <FeatureCard
              icon={HandCoins}
              title="Pay directly"
              description="Zelle, Venmo, cash — whatever you agree on. We never touch it."
              className="animate-fade-up animate-fade-up-delay-2"
            />
            <FeatureCard
              icon={ShieldOff}
              title="No false promises"
              description="We're a directory, not an insurer or employer."
              className="animate-fade-up animate-fade-up-delay-3"
            />
          </div>
        </div>
      </section>

      <EditorialBand
        image={SITE_IMAGES.delMarDogBeach.src}
        alt={SITE_IMAGES.delMarDogBeach.alt}
        label="How it works"
        title="Message first. Walk together."
        description="Browse local profiles, send a message through PawPath, and take scheduling and payment offline — on your terms, with someone who knows your neighborhood."
        imageFirst
      >
        <Link
          href="/how-it-works"
          className="group inline-flex items-center gap-1 text-sm font-medium text-trail-700 transition hover:text-trail-600"
        >
          See the full flow
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      </EditorialBand>

      {/* Comparison — full-bleed dark band */}
      <section className="section-pad bg-trail-950 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-trail-300">
            The difference
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Not another Rover clone.
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-trail-200/90">
            Most pet platforms take a cut of every walk. PawPath is intentionally
            different — built for neighbors, not national marketplaces.
          </p>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-sand-400">
                Typical platforms
              </p>
              <ul className="mt-5 space-y-3 text-sm leading-relaxed text-sand-300">
                <li>20%+ service fees on every booking</li>
                <li>In-app payments required</li>
                <li>Platform acts as intermediary for disputes</li>
                <li>Walkers compete nationally, not locally</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-trail-400/30 bg-trail-800/50 p-7 shadow-glow backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-trail-200">
                PawPath
              </p>
              <ul className="mt-5 space-y-3 text-sm leading-relaxed text-trail-50">
                <li>Zero fees for dog owners — ever</li>
                <li>Pay offline on your own terms</li>
                <li>Clear liability: arrangements are between you two</li>
                <li>Built for local neighborhoods first</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Walkers showcase */}
      <section className="section-pad">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="section-label">Local listings</p>
              <h2 className="headline-lg mt-3">Walkers near you.</h2>
              <p className="mt-3 text-sand-600">
                Browse verified local profiles
              </p>
            </div>
            <Link
              href="/find"
              className="group inline-flex items-center gap-1 text-sm font-medium text-trail-700 transition hover:text-trail-600"
            >
              View all
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredWalkers.map((walker) => (
              <WalkerCard key={walker.id} walker={walker} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="pb-20 pt-4">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <PhotoCtaBand
            image={SITE_IMAGES.beachWalkSunset.src}
            alt={SITE_IMAGES.beachWalkSunset.alt}
            title="Ready to find your walker?"
            description="Browse local profiles, send a message, and take it from there."
          >
            <Button
              href="/find"
              size="lg"
              className="bg-white text-trail-800 hover:bg-trail-50"
            >
              Explore walkers
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </PhotoCtaBand>

          <div className="mt-10">
            <DisclaimerBanner>
              PawPath helps you discover and message local dog walkers. We do not
              employ walkers, hold insurance, process payments, or guarantee any
              service. All agreements are directly between owners and walkers.
            </DisclaimerBanner>
          </div>
        </div>
      </section>
    </>
  );
}
