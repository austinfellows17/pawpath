import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDistance } from "@/lib/geo";
import { LISTING_TIERS, type WalkerListing } from "@/lib/constants";
import { WalkerPricing } from "@/components/walkers/walker-pricing";
import { WalkerAvatar } from "@/components/walkers/walker-avatar";
import { MapPin, Star, CheckCircle2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export function WalkerCard({
  walker,
  featured = false,
}: {
  walker: WalkerListing;
  featured?: boolean;
}) {
  const tierLabel = LISTING_TIERS[walker.listingTier].label;
  const isVerified = walker.verificationStatus === "APPROVED";

  return (
    <Link
      href={`/walkers/${walker.id}`}
      className={cn(
        "surface-card group block p-6",
        featured && "ring-1 ring-accent/15 shadow-glow"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <WalkerAvatar name={walker.name} photoUrl={walker.headshotUrl} size="sm" />
        <div className="flex flex-wrap justify-end gap-1.5">
          {walker.listingTier !== "BASIC" && (
            <Badge variant="tier">{tierLabel}</Badge>
          )}
          {isVerified && (
            <Badge variant="verified">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Verified
            </Badge>
          )}
          {walker.isPro && (
            <Badge variant="pro">
              <Shield className="mr-1 h-3 w-3" />
              Pro
            </Badge>
          )}
        </div>
      </div>

      <h3 className="mt-4 font-display text-lg font-semibold text-trail-900 group-hover:text-trail-700">
        {walker.name}
      </h3>
      <p className="text-sm text-trail-600">{walker.headline}</p>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-sand-700">
        {walker.distanceMiles !== undefined && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {formatDistance(walker.distanceMiles)}
          </span>
        )}
        {walker.neighborhood && (
          <span>{walker.neighborhood}</span>
        )}
        {walker.averageRating !== undefined && walker.reviewCount !== undefined && (
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" />
            {walker.averageRating.toFixed(1)} ({walker.reviewCount})
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {walker.services.slice(0, 3).map((service) => (
          <Badge key={service} variant="muted">
            {service}
          </Badge>
        ))}
      </div>

      {(walker.rate30Min || walker.rate60Min) && (
        <div className="mt-3">
          <WalkerPricing
            rate30Min={walker.rate30Min}
            rate60Min={walker.rate60Min}
            compact
          />
        </div>
      )}
    </Link>
  );
}
