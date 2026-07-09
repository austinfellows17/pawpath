"use client";

import { useCallback, useEffect, useState } from "react";
import { WalkerCard } from "@/components/walkers/walker-card";
import { WalkerMap } from "@/components/walkers/walker-map";
import { DisclaimerBanner } from "@/components/legal/disclaimer-banner";
import { SiteImage } from "@/components/visual/site-image";
import { Button } from "@/components/ui/button";
import { LAUNCH_REGION, PRICING_DISCLAIMER, type WalkerListing } from "@/lib/constants";
import { SITE_IMAGES } from "@/lib/site-images";
import { List, Map, Loader2 } from "lucide-react";

export default function FindWalkersPage() {
  const [zipCode, setZipCode] = useState<string>(LAUNCH_REGION.defaultZipCode);
  const [radius, setRadius] = useState<number>(
    LAUNCH_REGION.defaultRadiusMiles
  );
  const [view, setView] = useState<"list" | "map">("list");
  const [walkers, setWalkers] = useState<WalkerListing[]>([]);
  const [center, setCenter] = useState(LAUNCH_REGION.center);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchWalkers = useCallback(async () => {
    if (zipCode.length !== 5) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/walkers?zip=${zipCode}&radius=${radius}`
      );
      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      setWalkers(data.walkers);
      setCenter(data.center);
    } catch {
      setError("Unable to load walkers. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [zipCode, radius]);

  useEffect(() => {
    fetchWalkers();
  }, [fetchWalkers]);

  return (
    <>
      <div className="relative min-h-[11rem] overflow-hidden border-b border-sand-200/50 sm:min-h-[14rem]">
        <SiteImage
          src={SITE_IMAGES.northCountyCoast.src}
          alt=""
          fill
          className="object-cover object-center opacity-20"
          sizes="100vw"
          aria-hidden
          priority={false}
        />
        <div className="hero-band relative">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="section-label">Search</p>
          <h1 className="headline-lg mt-3">Find walkers near you</h1>
          <p className="body-lg mt-4 max-w-2xl">
            Search by zip code and radius. Message a walker to connect — contact
            details are shared only after you reach out.
          </p>
        </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="glass flex flex-col gap-4 rounded-3xl p-4 sm:flex-row sm:items-end sm:p-5">
        <div className="flex-1">
          <label htmlFor="zip" className="text-sm font-medium text-trail-800">
            Your zip code
          </label>
          <input
            id="zip"
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value.slice(0, 5))}
            placeholder="92024"
            className="mt-1 w-full rounded-xl border border-sand-300 bg-white px-4 py-2.5 text-trail-900 focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="radius" className="text-sm font-medium text-trail-800">
            Search radius: {radius} miles
          </label>
          <input
            id="radius"
            type="range"
            min={1}
            max={LAUNCH_REGION.maxRadiusMiles}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="mt-2 w-full accent-trail-600"
          />
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button
            variant={view === "list" ? "primary" : "outline"}
            size="sm"
            onClick={() => setView("list")}
          >
            <List className="mr-1 h-4 w-4" />
            List
          </Button>
          <Button
            variant={view === "map" ? "primary" : "outline"}
            size="sm"
            onClick={() => setView("map")}
          >
            <Map className="mr-1 h-4 w-4" />
            Map
          </Button>
        </div>
      </div>

      <p className="mt-4 text-sm text-sand-600">
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching...
          </span>
        ) : (
          <>
            {walkers.length} walker{walkers.length !== 1 ? "s" : ""} within{" "}
            {radius} miles
          </>
        )}
      </p>

      {error && (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      )}

      <div className="mt-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-trail-600" />
          </div>
        ) : view === "map" ? (
          <WalkerMap walkers={walkers} center={center} radiusMiles={radius} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {walkers.map((walker) => (
              <WalkerCard
                key={walker.id}
                walker={walker}
                featured={walker.listingTier === "FEATURED"}
              />
            ))}
            {walkers.length === 0 && (
              <p className="col-span-full text-center text-sand-600">
                No walkers found in this area yet. Try expanding your radius.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-10 space-y-4">
        <DisclaimerBanner compact>{PRICING_DISCLAIMER}</DisclaimerBanner>
      </div>
      </div>
    </>
  );
}
