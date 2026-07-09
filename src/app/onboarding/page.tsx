"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { WalkerOnboarding } from "@/components/onboarding/walker-onboarding";

function OwnerOnboardingForm() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [zipCode, setZipCode] = useState("");
  const [dogName, setDogName] = useState("");
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

    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zipCode, dogName: dogName || undefined }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Failed to save profile");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="hero-band min-h-[calc(100vh-4rem)] border-b border-sand-200/50">
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 sm:py-16">
        <div className="glass rounded-3xl p-8">
          <p className="section-label">Your profile</p>
          <h1 className="headline-lg mt-2">Complete your profile</h1>
          <p className="mt-3 text-sand-600">
            Help us match you with walkers near your dog.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="text-sm font-medium text-trail-800">
                Zip code
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
                Dog&apos;s name (optional)
              </label>
              <input
                value={dogName}
                onChange={(e) => setDogName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-sand-300 px-4 py-2.5 focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Save and continue"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function OnboardingRouter() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return <p className="p-8 text-center text-sand-600">Loading...</p>;
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  if (session.user.role === "WALKER") {
    return <WalkerOnboarding />;
  }

  return <OwnerOnboardingForm />;
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingRouter />
    </Suspense>
  );
}
