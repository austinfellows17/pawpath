"use client";

import { useMemo } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { LAUNCH_REGION, type WalkerListing } from "@/lib/constants";
import Link from "next/link";

export function WalkerMap({
  walkers,
  center,
  zoom = 11,
}: {
  walkers: WalkerListing[];
  center?: { latitude: number; longitude: number };
  zoom?: number;
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const mapCenter = center ?? LAUNCH_REGION.center;

  const viewState = useMemo(
    () => ({
      longitude: mapCenter.longitude,
      latitude: mapCenter.latitude,
      zoom,
    }),
    [mapCenter.latitude, mapCenter.longitude, zoom]
  );

  if (!token) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-2xl border border-dashed border-sand-300 bg-sand-100/50 text-center text-sm text-sand-600">
        <div>
          <p className="font-medium text-trail-800">Map preview</p>
          <p className="mt-1">
            Add <code className="text-xs">NEXT_PUBLIC_MAPBOX_TOKEN</code> to enable
            the interactive map.
          </p>
          <p className="mt-3 text-xs">
            {walkers.length} walker{walkers.length !== 1 ? "s" : ""} in this area
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[420px] overflow-hidden rounded-2xl border border-sand-200 shadow-inner">
      <Map
        initialViewState={viewState}
        mapboxAccessToken={token}
        mapStyle="mapbox://styles/mapbox/outdoors-v12"
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {walkers.map((walker) => (
          <Marker
            key={walker.id}
            longitude={walker.longitude}
            latitude={walker.latitude}
            anchor="bottom"
          >
            <Link
              href={`/walkers/${walker.id}`}
              className="group flex flex-col items-center"
            >
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium shadow-md transition group-hover:scale-105 ${
                  walker.listingTier === "FEATURED"
                    ? "bg-accent text-white"
                    : walker.listingTier === "STANDARD"
                      ? "bg-trail-600 text-white"
                      : "bg-white text-trail-800 border border-trail-200"
                }`}
              >
                {walker.name.split(" ")[0]}
              </span>
              <span className="mt-1 h-2 w-2 rotate-45 bg-inherit" />
            </Link>
          </Marker>
        ))}
      </Map>
    </div>
  );
}
