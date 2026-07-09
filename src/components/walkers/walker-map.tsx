"use client";

import { useMemo } from "react";
import Map, { Marker, NavigationControl, Source, Layer } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { LAUNCH_REGION, type WalkerListing } from "@/lib/constants";
import Link from "next/link";

function createCircleGeoJSON(
  center: { latitude: number; longitude: number },
  radiusMiles: number,
  points = 64
) {
  const coords: [number, number][] = [];
  const distanceX = radiusMiles / (69 * Math.cos((center.latitude * Math.PI) / 180));
  const distanceY = radiusMiles / 69;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([center.longitude + x, center.latitude + y]);
  }
  coords.push(coords[0]);

  return {
    type: "Feature" as const,
    geometry: {
      type: "Polygon" as const,
      coordinates: [coords],
    },
    properties: {},
  };
}

export function WalkerMap({
  walkers,
  center,
  radiusMiles,
  zoom = 11,
}: {
  walkers: WalkerListing[];
  center?: { latitude: number; longitude: number };
  radiusMiles?: number;
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

  const searchRadius = useMemo(() => {
    if (!radiusMiles) return null;
    return createCircleGeoJSON(mapCenter, radiusMiles);
  }, [mapCenter, radiusMiles]);

  const radiusFillLayer = {
    id: "search-radius-fill",
    type: "fill" as const,
    paint: {
      "fill-color": "#2d6a4f",
      "fill-opacity": 0.08,
    },
  };

  const radiusLineLayer = {
    id: "search-radius-line",
    type: "line" as const,
    paint: {
      "line-color": "#2d6a4f",
      "line-width": 2,
      "line-opacity": 0.35,
    },
  };

  if (!token) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-2xl border border-dashed border-sand-300 bg-sand-100/50 text-center text-sm text-sand-600">
        <div className="max-w-sm px-4">
          <p className="font-medium text-trail-800">Map unavailable</p>
          <p className="mt-1">
            Set <code className="text-xs">NEXT_PUBLIC_MAPBOX_TOKEN</code> in your
            environment to enable the interactive map.
          </p>
          <p className="mt-3 text-xs">
            {walkers.length} walker{walkers.length !== 1 ? "s" : ""} in this area
            — switch to list view to browse.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[min(70vh,520px)] min-h-[420px] overflow-hidden rounded-2xl border border-sand-200 shadow-inner">
      <Map
        initialViewState={viewState}
        mapboxAccessToken={token}
        mapStyle="mapbox://styles/mapbox/outdoors-v12"
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {searchRadius && (
          <Source id="search-radius" type="geojson" data={searchRadius}>
            <Layer {...radiusFillLayer} />
            <Layer {...radiusLineLayer} />
          </Source>
        )}

        <Marker
          longitude={mapCenter.longitude}
          latitude={mapCenter.latitude}
          anchor="center"
        >
          <span className="block h-3 w-3 rounded-full border-2 border-white bg-trail-600 shadow-md" />
        </Marker>

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
                className={`rounded-full px-2.5 py-1 text-xs font-medium shadow-md transition group-hover:scale-105 ${
                  walker.listingTier === "FEATURED"
                    ? "bg-accent text-white"
                    : walker.listingTier === "STANDARD"
                      ? "bg-trail-600 text-white"
                      : "bg-white text-trail-800 border border-trail-200"
                }`}
              >
                {walker.name.split(" ")[0]}
              </span>
            </Link>
          </Marker>
        ))}
      </Map>
    </div>
  );
}
