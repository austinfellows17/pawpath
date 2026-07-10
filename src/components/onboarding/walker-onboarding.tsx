"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { WALKER_SERVICES } from "@/lib/constants";
import type { ListingTier } from "@prisma/client";
import {
  WALKER_ONBOARDING_STEPS,
  MIN_ACCOUNT_AGE_HOURS,
  type WalkerOnboardingStep,
} from "@/lib/walker-application";
import { HeadshotPanel } from "@/components/onboarding/headshot-panel";
import { ProfilePhotosPanel } from "@/components/onboarding/profile-photos-panel";
import { VerificationPanel } from "@/components/onboarding/verification-panel";
import { CredentialsPanel } from "@/components/onboarding/credentials-panel";
import { CheckCircle2, Loader2 } from "lucide-react";

type WalkerProfile = {
  zipCode: string;
  headline: string;
  bio: string;
  rate30Min: string | null;
  rate60Min: string | null;
  phone: string | null;
  serviceRadiusMiles: number;
  services: string[];
  headshotUrl: string | null;
  photoUrls: string[];
  listingTier: ListingTier;
  verificationStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  listingReviewStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  listingReviewNotes: string | null;
  clientReferenceName: string | null;
  clientReferenceContact: string | null;
  clientReferenceNotes: string | null;
};

const stepLabels: Record<WalkerOnboardingStep, string> = {
  listing: "Listing",
  headshot: "Headshot",
  verification: "ID check",
  credentials: "Pro docs",
  submit: "Review",
};

function normalizeStep(value: string | null): WalkerOnboardingStep {
  if (value && WALKER_ONBOARDING_STEPS.includes(value as WalkerOnboardingStep)) {
    return value as WalkerOnboardingStep;
  }
  return "listing";
}

export function WalkerOnboarding() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = normalizeStep(searchParams.get("step"));

  const [profile, setProfile] = useState<WalkerProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [zipCode, setZipCode] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [rate30Min, setRate30Min] = useState("");
  const [rate60Min, setRate60Min] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceRadiusMiles, setServiceRadiusMiles] = useState(5);
  const [services, setServices] = useState<string[]>([]);
  const [clientReferenceName, setClientReferenceName] = useState("");
  const [clientReferenceContact, setClientReferenceContact] = useState("");
  const [clientReferenceNotes, setClientReferenceNotes] = useState("");
  const [headshotUrl, setHeadshotUrl] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [listingTier, setListingTier] = useState<ListingTier>("BASIC");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitEligibility, setSubmitEligibility] = useState<{
    canSubmit: boolean;
    accountAgeMessage: string | null;
  } | null>(null);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    const response = await fetch("/api/profile");
    if (response.ok) {
      const data = await response.json();
      const p = data.profile as WalkerProfile | null;
      setProfile(p);
      if (p) {
        setZipCode(p.zipCode ?? "");
        setHeadline(p.headline ?? "");
        setBio(p.bio ?? "");
        setRate30Min(p.rate30Min ?? "");
        setRate60Min(p.rate60Min ?? "");
        setPhone(p.phone ?? "");
        setServiceRadiusMiles(p.serviceRadiusMiles ?? 5);
        setServices(p.services ?? []);
        setHeadshotUrl(p.headshotUrl ?? "");
        setPhotoUrls(p.photoUrls ?? []);
        setListingTier(p.listingTier ?? "BASIC");
        setClientReferenceName(p.clientReferenceName ?? "");
        setClientReferenceContact(p.clientReferenceContact ?? "");
        setClientReferenceNotes(p.clientReferenceNotes ?? "");
      }
    }
    setLoadingProfile(false);
  }, []);

  const loadSubmitEligibility = useCallback(async () => {
    const response = await fetch("/api/profile/submit");
    if (response.ok) {
      const data = await response.json();
      setSubmitEligibility({
        canSubmit: data.canSubmit,
        accountAgeMessage: data.accountAgeMessage,
      });
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (step === "submit") {
      void loadSubmitEligibility();
    }
  }, [step, loadSubmitEligibility]);

  function goToStep(next: WalkerOnboardingStep) {
    router.push(`/onboarding?step=${next}`);
  }

  function toggleService(service: string) {
    setServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  }

  async function saveListing() {
    setSaving(true);
    setError("");

    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        zipCode,
        headline,
        bio,
        rate30Min,
        rate60Min,
        phone,
        serviceRadiusMiles,
        services,
        clientReferenceName: clientReferenceName || undefined,
        clientReferenceContact: clientReferenceContact || undefined,
        clientReferenceNotes: clientReferenceNotes || undefined,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Failed to save listing");
      setSaving(false);
      return;
    }

    await loadProfile();
    setSaving(false);
    goToStep("headshot");
  }

  async function handleSubmitApplication() {
    setSubmitting(true);
    setError("");

    const response = await fetch("/api/profile/submit", { method: "POST" });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Failed to submit application");
      setSubmitting(false);
      return;
    }

    router.push("/dashboard");
  }

  const idSubmitted =
    profile?.verificationStatus === "PENDING" ||
    profile?.verificationStatus === "APPROVED";

  if (loadingProfile) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-trail-600" />
      </div>
    );
  }

  return (
    <div className="hero-band min-h-[calc(100vh-4rem)] border-b border-sand-200/50">
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 sm:py-16">
        <div className="glass rounded-3xl p-8">
          <p className="section-label">Walker application</p>
          <h1 className="headline-lg mt-2">Set up your listing</h1>
          <p className="mt-3 text-sand-600">
            Complete every step below. An admin reviews each application before
            your listing goes live.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {WALKER_ONBOARDING_STEPS.map((s, index) => (
              <button
                key={s}
                type="button"
                onClick={() => goToStep(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  step === s
                    ? "bg-trail-700 text-white"
                    : "bg-sand-100 text-sand-600 hover:bg-sand-200"
                }`}
              >
                {index + 1}. {stepLabels[s]}
              </button>
            ))}
          </div>

          {profile?.listingReviewStatus === "REJECTED" && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-medium">Previous application not approved</p>
              {profile.listingReviewNotes && (
                <p className="mt-1">Note: {profile.listingReviewNotes}</p>
              )}
              <p className="mt-2">Update your info and resubmit when ready.</p>
            </div>
          )}

          {step === "listing" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void saveListing();
              }}
              className="mt-8 space-y-4"
            >
              <div>
                <label className="text-sm font-medium text-trail-800">
                  Zip code <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value.slice(0, 5))}
                  placeholder="92024"
                  className="mt-1 w-full rounded-xl border border-sand-300 px-4 py-2.5 focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-trail-800">
                  Headline <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  minLength={5}
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="North Park · 5 years experience"
                  className="mt-1 w-full rounded-xl border border-sand-300 px-4 py-2.5 focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-trail-800">
                  Bio <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  minLength={50}
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell owners about your experience with dogs, your neighborhood, and what makes your walks great..."
                  className="mt-1 w-full rounded-xl border border-sand-300 px-4 py-2.5 focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
                />
                <p className="mt-1 text-xs text-sand-500">
                  {bio.length}/50 characters minimum
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-trail-800">
                    30-min walk rate <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={rate30Min}
                    onChange={(e) => setRate30Min(e.target.value)}
                    placeholder="$22"
                    className="mt-1 w-full rounded-xl border border-sand-300 px-4 py-2.5 focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-trail-800">
                    1-hour walk rate <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={rate60Min}
                    onChange={(e) => setRate60Min(e.target.value)}
                    placeholder="$35"
                    className="mt-1 w-full rounded-xl border border-sand-300 px-4 py-2.5 focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-trail-800">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(760) 555-0100"
                  className="mt-1 w-full rounded-xl border border-sand-300 px-4 py-2.5 focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
                />
                <p className="mt-1 text-xs text-sand-500">
                  Shared with owners only after they message you.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-trail-800">
                  Service radius <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="number"
                  min={1}
                  max={25}
                  value={serviceRadiusMiles}
                  onChange={(e) =>
                    setServiceRadiusMiles(
                      Math.min(25, Math.max(1, Number(e.target.value) || 1))
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-sand-300 px-4 py-2.5 focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
                />
                <p className="mt-1 text-xs text-sand-500">
                  How far you&apos;re willing to travel from your zip code (miles).
                  Owners outside this radius won&apos;t see you in search.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-trail-800">
                  Services <span className="text-red-500">*</span>
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {WALKER_SERVICES.map((service) => (
                    <button
                      key={service}
                      type="button"
                      onClick={() => toggleService(service)}
                      className={`rounded-full px-3 py-1 text-sm transition ${
                        services.includes(service)
                          ? "bg-trail-700 text-white"
                          : "bg-sand-100 text-sand-700 hover:bg-sand-200"
                      }`}
                    >
                      {service}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-sand-200 bg-sand-50 p-4">
                <p className="text-sm font-medium text-trail-900">
                  Client reference (optional)
                </p>
                <p className="mt-1 text-xs text-sand-600">
                  A past dog owner who can vouch for you — helps admins approve
                  your application faster.
                </p>
                <div className="mt-3 space-y-3">
                  <input
                    value={clientReferenceName}
                    onChange={(e) => setClientReferenceName(e.target.value)}
                    placeholder="Reference name"
                    className="w-full rounded-xl border border-sand-300 px-4 py-2.5 text-sm focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
                  />
                  <input
                    value={clientReferenceContact}
                    onChange={(e) => setClientReferenceContact(e.target.value)}
                    placeholder="Phone or email"
                    className="w-full rounded-xl border border-sand-300 px-4 py-2.5 text-sm focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
                  />
                  <textarea
                    value={clientReferenceNotes}
                    onChange={(e) => setClientReferenceNotes(e.target.value)}
                    rows={2}
                    placeholder="How do they know your dog walking?"
                    className="w-full rounded-xl border border-sand-300 px-4 py-2.5 text-sm focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button
                type="submit"
                className="w-full"
                disabled={saving || services.length === 0}
              >
                {saving ? "Saving..." : "Continue to headshot"}
              </Button>
            </form>
          )}

          {step === "headshot" && (
            <div className="mt-8 space-y-6">
              <HeadshotPanel
                initialUrl={headshotUrl}
                onUploaded={(url) => {
                  setHeadshotUrl(url);
                  setPhotoUrls((current) =>
                    current.length ? [url, ...current.filter((item) => item !== url)] : [url]
                  );
                  void loadProfile();
                }}
              />
              <ProfilePhotosPanel
                headshotUrl={headshotUrl || null}
                photoUrls={photoUrls}
                listingTier={listingTier}
                onChange={setPhotoUrls}
              />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => goToStep("listing")}
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={!headshotUrl}
                  onClick={() => goToStep("verification")}
                >
                  Continue to ID check
                </Button>
              </div>
            </div>
          )}

          {step === "verification" && (
            <div className="mt-8 space-y-6">
              <p className="text-sm text-sand-600">
                Upload a government-issued ID so we can verify your identity
                before your listing goes live.
              </p>
              <VerificationPanel required onStatusChange={() => loadProfile()} />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => goToStep("headshot")}
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={!idSubmitted}
                  onClick={() => goToStep("credentials")}
                >
                  Continue to Pro docs
                </Button>
              </div>
            </div>
          )}

          {step === "credentials" && (
            <div className="mt-8 space-y-6">
              <CredentialsPanel />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => goToStep("verification")}
                >
                  Back
                </Button>
                <Button className="flex-1" onClick={() => goToStep("submit")}>
                  Continue to review
                </Button>
              </div>
            </div>
          )}

          {step === "submit" && (
            <div className="mt-8 space-y-6">
              <div className="rounded-2xl border border-sand-200 bg-sand-50 p-5 text-sm text-sand-700">
                <p className="font-medium text-trail-900">Ready to submit?</p>
                <ul className="mt-3 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-trail-600" />
                    Listing details complete
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2
                      className={`h-4 w-4 ${headshotUrl ? "text-trail-600" : "text-sand-400"}`}
                    />
                    Headshot uploaded
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2
                      className={`h-4 w-4 ${idSubmitted ? "text-trail-600" : "text-sand-400"}`}
                    />
                    ID submitted for review
                  </li>
                </ul>
                <p className="mt-4">
                  After you submit, an admin will review your application. You
                  won&apos;t appear in search until approved — usually within 1–2
                  business days.
                </p>
                <p className="mt-3 text-xs text-sand-500">
                  New accounts must be at least {MIN_ACCOUNT_AGE_HOURS} hours
                  old before submitting (anti-spam measure).
                </p>
              </div>
              {submitEligibility?.accountAgeMessage && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  {submitEligibility.accountAgeMessage}
                </div>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => goToStep("credentials")}
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={
                    submitting ||
                    !headshotUrl ||
                    !idSubmitted ||
                    services.length === 0 ||
                    submitEligibility?.canSubmit === false
                  }
                  onClick={() => void handleSubmitApplication()}
                >
                  {submitting ? "Submitting..." : "Submit for review"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
