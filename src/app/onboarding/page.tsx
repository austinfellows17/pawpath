"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { WALKER_SERVICES } from "@/lib/constants";
import { VerificationPanel } from "@/components/onboarding/verification-panel";

function OnboardingForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isVerification = searchParams.get("step") === "verification";

  const role = session?.user?.role ?? "OWNER";

  const [zipCode, setZipCode] = useState("");
  const [dogName, setDogName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [rate30Min, setRate30Min] = useState("");
  const [rate60Min, setRate60Min] = useState("");
  const [phone, setPhone] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (status === "loading") {
    return <p className="p-8 text-center text-sand-600">Loading...</p>;
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload =
      role === "OWNER"
        ? { zipCode, dogName: dogName || undefined }
        : {
            zipCode,
            headline,
            bio,
            rate30Min: rate30Min || undefined,
            rate60Min: rate60Min || undefined,
            phone: phone || undefined,
            services,
          };

    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Failed to save profile");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  function toggleService(service: string) {
    setServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  }

  if (isVerification && role === "WALKER") {
    return (
      <div className="hero-band min-h-[calc(100vh-4rem)] border-b border-sand-200/50">
        <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 sm:py-16">
          <div className="glass rounded-3xl p-8">
            <p className="section-label">Trust & safety</p>
            <h1 className="headline-lg mt-2">Walker verification</h1>
            <p className="mt-3 text-sand-600">
              Submit a government-issued ID for manual review by our admin team.
              Verified walkers receive a trust badge on their profile.
            </p>
            <div className="mt-6">
              <VerificationPanel />
            </div>
            <Button href="/dashboard" variant="outline" className="mt-6 w-full">
              Back to dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-band min-h-[calc(100vh-4rem)] border-b border-sand-200/50">
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 sm:py-16">
        <div className="glass rounded-3xl p-8">
          <p className="section-label">
            {role === "WALKER" ? "Your listing" : "Your profile"}
          </p>
          <h1 className="headline-lg mt-2">
            {role === "WALKER" ? "Set up your listing" : "Complete your profile"}
          </h1>
          <p className="mt-3 text-sand-600">
            {role === "WALKER"
              ? "Tell owners in your area about your services."
              : "Help us match you with walkers near your dog."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="text-sm font-medium text-trail-800">Zip code</label>
          <input
            required
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value.slice(0, 5))}
            placeholder="92024"
            className="mt-1 w-full rounded-xl border border-sand-300 px-4 py-2.5 focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
          />
        </div>

        {role === "OWNER" && (
          <div>
            <label className="text-sm font-medium text-trail-800">
              Dog&apos;s name (optional)
            </label>
            <input
              value={dogName}
              onChange={(e) => setDogName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-sand-300 px-4 py-2.5 focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
            />
          </div>
        )}

        {role === "WALKER" && (
          <>
            <div>
              <label className="text-sm font-medium text-trail-800">
                Headline
              </label>
              <input
                required
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="North Park · 5 years experience"
                className="mt-1 w-full rounded-xl border border-sand-300 px-4 py-2.5 focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-trail-800">Bio</label>
              <textarea
                required
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="mt-1 w-full rounded-xl border border-sand-300 px-4 py-2.5 focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-trail-800">
                  30-min walk rate
                </label>
                <input
                  value={rate30Min}
                  onChange={(e) => setRate30Min(e.target.value)}
                  placeholder="$22"
                  className="mt-1 w-full rounded-xl border border-sand-300 px-4 py-2.5 focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-trail-800">
                  1-hour walk rate
                </label>
                <input
                  value={rate60Min}
                  onChange={(e) => setRate60Min(e.target.value)}
                  placeholder="$35"
                  className="mt-1 w-full rounded-xl border border-sand-300 px-4 py-2.5 focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
                />
              </div>
            </div>
            <p className="text-xs text-sand-600">
              Extended walks are discussed after owners message you. Rates are
              informational only.
            </p>
            <div>
              <label className="text-sm font-medium text-trail-800">
                Phone (shared after first message)
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(760) 555-0100"
                className="mt-1 w-full rounded-xl border border-sand-300 px-4 py-2.5 focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-trail-800">
                Services
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
          </>
        )}

        {role === "WALKER" && services.length === 0 && (
          <p className="text-sm text-sand-600">Select at least one service.</p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button
          type="submit"
          className="w-full"
          disabled={loading || (role === "WALKER" && services.length === 0)}
        >
          {loading ? "Saving..." : "Save and continue"}
        </Button>
      </form>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingForm />
    </Suspense>
  );
}
