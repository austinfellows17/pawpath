import {
  ListingReviewStatus,
  VerificationStatus,
  type WalkerProfile,
} from "@prisma/client";
import { z } from "zod";

export const MIN_ACCOUNT_AGE_HOURS = 24;

export const WALKER_ONBOARDING_STEPS = [
  "listing",
  "headshot",
  "verification",
  "credentials",
  "submit",
] as const;

export type WalkerOnboardingStep = (typeof WALKER_ONBOARDING_STEPS)[number];

export const walkerReferenceSchema = z.object({
  clientReferenceName: z.string().max(120).optional(),
  clientReferenceContact: z.string().max(120).optional(),
  clientReferenceNotes: z.string().max(500).optional(),
});

export const walkerListingSchema = z
  .object({
    zipCode: z.string().regex(/^\d{5}$/, "Enter a valid 5-digit zip code"),
    headline: z
      .string()
      .min(5, "Headline must be at least 5 characters")
      .max(120),
    bio: z
      .string()
      .min(
        50,
        "Bio must be at least 50 characters — tell owners about your experience"
      ),
    rate30Min: z.string().min(1, "30-minute rate is required").max(20),
    rate60Min: z.string().min(1, "1-hour rate is required").max(20),
    services: z.array(z.string()).min(1, "Select at least one service"),
    phone: z
      .string()
      .min(10, "Phone number is required")
      .refine(
        (value) => value.replace(/\D/g, "").length >= 10,
        "Enter a valid phone number"
      ),
    serviceRadiusMiles: z
      .number()
      .min(1, "Service radius must be at least 1 mile")
      .max(25, "Service radius cannot exceed 25 miles"),
  })
  .merge(walkerReferenceSchema);

export type WalkerListingInput = z.infer<typeof walkerListingSchema>;

export function getAccountAgeHours(createdAt: Date) {
  return (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
}

export function canSubmitByAccountAge(createdAt: Date) {
  return getAccountAgeHours(createdAt) >= MIN_ACCOUNT_AGE_HOURS;
}

export function getAccountAgeWaitMessage(createdAt: Date) {
  const hoursLeft = Math.ceil(MIN_ACCOUNT_AGE_HOURS - getAccountAgeHours(createdAt));
  return `New accounts must wait ${MIN_ACCOUNT_AGE_HOURS} hours before submitting. Check back in about ${hoursLeft} hour${hoursLeft === 1 ? "" : "s"}.`;
}

export function hasCompleteListing(
  profile: Pick<
    WalkerProfile,
    | "zipCode"
    | "headline"
    | "bio"
    | "rate30Min"
    | "rate60Min"
    | "services"
    | "phone"
    | "serviceRadiusMiles"
  >
) {
  return walkerListingSchema.safeParse({
    zipCode: profile.zipCode,
    headline: profile.headline,
    bio: profile.bio,
    rate30Min: profile.rate30Min ?? "",
    rate60Min: profile.rate60Min ?? "",
    services: profile.services,
    phone: profile.phone ?? "",
    serviceRadiusMiles: profile.serviceRadiusMiles ?? 5,
  }).success;
}

export function hasHeadshot(profile: Pick<WalkerProfile, "headshotUrl">) {
  return Boolean(profile.headshotUrl?.trim());
}

export function hasIdSubmitted(
  profile: Pick<WalkerProfile, "verificationStatus">
) {
  return (
    profile.verificationStatus === VerificationStatus.PENDING ||
    profile.verificationStatus === VerificationStatus.APPROVED
  );
}

export function isListingLive(
  profile: Pick<WalkerProfile, "isActive" | "listingReviewStatus">
) {
  return (
    profile.isActive &&
    profile.listingReviewStatus === ListingReviewStatus.APPROVED
  );
}

export function getWalkerOnboardingStep(
  profile: WalkerProfile | null
): WalkerOnboardingStep {
  if (!profile || !hasCompleteListing(profile)) return "listing";
  if (!hasHeadshot(profile)) return "headshot";
  if (!hasIdSubmitted(profile)) return "verification";
  if (
    profile.listingReviewStatus === ListingReviewStatus.NONE ||
    profile.listingReviewStatus === ListingReviewStatus.REJECTED
  ) {
    return "submit";
  }
  return "submit";
}

export function needsWalkerOnboarding(profile: WalkerProfile | null) {
  if (!profile) return true;
  if (profile.listingReviewStatus === ListingReviewStatus.PENDING) return false;
  if (isListingLive(profile)) return false;
  if (profile.listingReviewStatus === ListingReviewStatus.REJECTED) return false;

  return (
    !hasCompleteListing(profile) ||
    !hasHeadshot(profile) ||
    !hasIdSubmitted(profile) ||
    profile.listingReviewStatus === ListingReviewStatus.NONE
  );
}

export function canSubmitApplication(profile: WalkerProfile) {
  return (
    hasCompleteListing(profile) &&
    hasHeadshot(profile) &&
    hasIdSubmitted(profile) &&
    (profile.listingReviewStatus === ListingReviewStatus.NONE ||
      profile.listingReviewStatus === ListingReviewStatus.REJECTED)
  );
}

export function describePendingChanges(changes: string[]) {
  return changes.join(", ");
}
