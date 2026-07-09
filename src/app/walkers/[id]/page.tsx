import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DisclaimerBanner } from "@/components/legal/disclaimer-banner";
import { WalkerConnectPanel } from "@/components/walkers/walker-connect-panel";
import { WalkerReviewsSection } from "@/components/walkers/walker-reviews-section";
import { WalkerAvatar } from "@/components/walkers/walker-avatar";
import { WalkerPricing } from "@/components/walkers/walker-pricing";
import {
  LISTING_TIERS,
  PRICING_DISCLAIMER,
  LIABILITY_DISCLAIMER,
} from "@/lib/constants";
import { getWalkerById } from "@/lib/walkers";
import { formatDistance, haversineDistanceMiles } from "@/lib/geo";
import { LAUNCH_REGION } from "@/lib/constants";
import { getSession } from "@/lib/session";
import { ReportWalkerButton } from "@/components/walkers/report-walker-button";
import { BackgroundCheckedBadge } from "@/components/walkers/background-checked-badge";
import { MapPin, Star, CheckCircle2, Shield } from "lucide-react";

export default async function WalkerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [walker, session] = await Promise.all([getWalkerById(id), getSession()]);

  if (!walker) {
    notFound();
  }

  const distance = haversineDistanceMiles(
    LAUNCH_REGION.center.latitude,
    LAUNCH_REGION.center.longitude,
    walker.latitude,
    walker.longitude
  );

  const tierInfo = LISTING_TIERS[walker.listingTier];

  return (
    <>
      <div className="hero-band border-b border-sand-200/50">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
          <Link
            href="/find"
            className="text-sm font-medium text-trail-600 transition hover:text-trail-800"
          >
            ← Back to search
          </Link>

          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
            <WalkerAvatar name={walker.name} photoUrl={walker.headshotUrl} size="lg" />
            <div className="flex-1">
              <div className="flex flex-wrap gap-2">
                {walker.listingTier !== "BASIC" && (
                  <Badge variant="tier">{tierInfo.label}</Badge>
                )}
                {walker.verificationStatus === "APPROVED" && (
                  <Badge variant="verified">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    PawPath Verified
                  </Badge>
                )}
                {walker.isPro && (
                  <Badge variant="pro">
                    <Shield className="mr-1 h-3 w-3" />
                    Pro
                  </Badge>
                )}
              </div>
              <h1 className="headline-lg mt-3">
                <span className="inline-flex flex-wrap items-center gap-3">
                  {walker.isBackgroundChecked && <BackgroundCheckedBadge size="md" />}
                  <span>{walker.name}</span>
                </span>
              </h1>
              <p className="mt-2 text-lg text-trail-600">{walker.headline}</p>

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-sand-700">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-trail-500" />
                  {walker.neighborhood}, {walker.city} ·{" "}
                  {formatDistance(distance)}
                </span>
                {walker.averageRating !== undefined && (
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    {walker.averageRating.toFixed(1)} ({walker.reviewCount}{" "}
                    reviews)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="surface-card p-6 sm:p-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <h2 className="font-medium text-trail-900">About</h2>
              <p className="mt-2 leading-relaxed text-sand-700">{walker.bio}</p>

              <h2 className="mt-8 font-medium text-trail-900">Services</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {walker.services.map((service) => (
                  <Badge key={service}>{service}</Badge>
                ))}
              </div>

              {(walker.rate30Min || walker.rate60Min) && (
                <div className="mt-8">
                  <h2 className="font-medium text-trail-900">
                    Rates (informational)
                  </h2>
                  <div className="mt-4">
                    <WalkerPricing
                      rate30Min={walker.rate30Min}
                      rate60Min={walker.rate60Min}
                    />
                  </div>
                </div>
              )}
            </div>

            <WalkerConnectPanel
              walkerProfileId={walker.id}
              walkerName={walker.name}
              walkerUserId={walker.userId}
            />
          </div>
        </div>

        <WalkerReviewsSection
          walkerProfileId={walker.id}
          walkerName={walker.name}
        />

        <div className="mt-8 space-y-4">
          {session?.user?.role === "OWNER" && (
            <ReportWalkerButton
              walkerProfileId={walker.id}
              walkerName={walker.name}
            />
          )}
          <DisclaimerBanner compact>{PRICING_DISCLAIMER}</DisclaimerBanner>
          <DisclaimerBanner compact>{LIABILITY_DISCLAIMER}</DisclaimerBanner>
        </div>
      </div>
    </>
  );
}
