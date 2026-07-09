import { ListingTier, UserRole, VerificationStatus } from "@prisma/client";

export const APP_NAME = "PawPath";

export const TAGLINE = "Your neighborhood. Your walker. No middleman.";

export const BETA_NOTICE = {
  label: "Beta",
  message:
    "PawPath is in beta. We're currently focused on North San Diego County — more areas coming soon.",
} as const;

export const LAUNCH_REGION = {
  name: "North San Diego County",
  state: "CA",
  center: {
    latitude: 33.045,
    longitude: -117.275,
  },
  defaultRadiusMiles: 12,
  maxRadiusMiles: 25,
  defaultZipCode: "92024",
} as const;

export const PRICING_DISCLAIMER =
  "Rates shown are informational only. Final pricing and payment are agreed directly between you and your walker (e.g., Zelle, Venmo, cash). PawPath does not process payments.";

export const LIABILITY_DISCLAIMER =
  "PawPath is a local connection platform only. We do not employ walkers, verify insurance, or guarantee services. All arrangements, payments, and liability are solely between dog owners and walkers.";

export const LISTING_TIERS: Record<
  ListingTier,
  {
    label: string;
    description: string;
    features: string[];
    monthlyPriceCents: number;
    priceLabel: string;
    stripePriceEnvKey: string | null;
  }
> = {
  BASIC: {
    label: "Trailhead",
    description: "Get listed and be discoverable in your area.",
    features: [
      "Profile listing in search results",
      "In-app messaging with owners",
      "Contact info shared after first message",
    ],
    monthlyPriceCents: 0,
    priceLabel: "Free",
    stripePriceEnvKey: null,
  },
  STANDARD: {
    label: "Summit",
    description: "Stand out in local search with enhanced visibility.",
    features: [
      "Priority placement in search & map",
      "Optional $50 background check add-on + BG Verified badge",
      "Verified badge (after admin approval)",
      "Up to 6 profile photos",
    ],
    monthlyPriceCents: 1900,
    priceLabel: "$19/mo",
    stripePriceEnvKey: "STRIPE_PRICE_STANDARD",
  },
  FEATURED: {
    label: "Peak",
    description: "Maximum visibility for established local walkers.",
    features: [
      "Top of search & featured map pins",
      "Optional $50 background check add-on + BG Verified badge",
      "Highlighted profile card",
      "Up to 12 profile photos",
    ],
    monthlyPriceCents: 3900,
    priceLabel: "$39/mo",
    stripePriceEnvKey: "STRIPE_PRICE_FEATURED",
  },
};

/** Max profile photos (including headshot) per listing tier */
export const PHOTO_LIMIT_BY_TIER: Record<ListingTier, number> = {
  BASIC: 1,
  STANDARD: 6,
  FEATURED: 12,
};

export function getPhotoLimitForTier(tier: ListingTier) {
  return PHOTO_LIMIT_BY_TIER[tier];
}

export const PAID_LISTING_TIERS = ["STANDARD", "FEATURED"] as const;
export type PaidListingTier = (typeof PAID_LISTING_TIERS)[number];

/** One-time add-on for Summit/Peak walkers — full Checkr screening + BG Verified badge */
export const BACKGROUND_CHECK_ADDON = {
  label: "Background check",
  description:
    "Full criminal background screening via Checkr and the BG Verified badge on your listing.",
  priceCents: 5000,
  priceLabel: "$50",
  stripePriceEnvKey: "STRIPE_PRICE_BACKGROUND_CHECK",
} as const;

export const WALKER_SERVICES = [
  "Dog walking",
  "Puppy visits",
  "Adventure hikes",
  "Drop-in visits",
  "Overnight sitting",
  "Multi-dog walks",
] as const;

export const SAN_DIEGO_ZIPS = [
  "92101", "92102", "92103", "92104", "92105", "92106", "92107", "92108",
  "92109", "92110", "92111", "92113", "92114", "92115", "92116", "92117",
  "92119", "92120", "92121", "92122", "92123", "92124", "92126", "92127",
  "92128", "92129", "92130", "92131", "92132", "92134", "92135", "92139",
  "92140", "92145", "92147", "92154", "92155", "92173", "91910", "91911",
  "91913", "91914", "91915", "91932", "91941", "91942", "91945", "91950",
  "91977", "91978", "92007", "92008", "92009", "92010", "92011", "92014",
  "92019", "92020", "92024", "92025", "92026", "92027", "92028", "92029",
  "92037", "92054", "92056", "92057", "92064", "92065", "92066", "92067",
  "92069", "92071", "92075", "92078", "92081", "92082", "92083", "92084",
  "92091", "92092", "92093", "92118", "92135",
] as const;

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
  image?: string | null;
};

export const EXTENDED_WALK_PRICING_NOTE =
  "Discuss after messaging — pricing agreed directly with your walker.";

export type WalkerListing = {
  id: string;
  userId: string;
  name: string;
  headline: string;
  bio: string;
  services: string[];
  rate30Min: string | null;
  rate60Min: string | null;
  zipCode: string;
  city: string | null;
  neighborhood: string | null;
  latitude: number;
  longitude: number;
  serviceRadiusMiles: number;
  listingTier: ListingTier;
  verificationStatus: VerificationStatus;
  headshotUrl: string | null;
  isPro: boolean;
  isBackgroundChecked: boolean;
  photoUrls: string[];
  distanceMiles?: number;
  averageRating?: number;
  reviewCount?: number;
};
