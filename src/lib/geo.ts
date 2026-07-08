const EARTH_RADIUS_MILES = 3958.8;

export function haversineDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(miles: number): string {
  if (miles < 0.1) return "Nearby";
  if (miles < 1) return `${(miles * 5280).toFixed(0)} ft away`;
  return `${miles.toFixed(1)} mi away`;
}

export async function geocodeZipCode(
  zipCode: string
): Promise<{ latitude: number; longitude: number; city?: string } | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    return getSanDiegoZipFallback(zipCode);
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${zipCode}.json?country=US&types=postcode&access_token=${token}`
    );
    if (!response.ok) return getSanDiegoZipFallback(zipCode);

    const data = await response.json();
    const feature = data.features?.[0];
    if (!feature?.center) return getSanDiegoZipFallback(zipCode);

    const [longitude, latitude] = feature.center;
    const city = feature.context?.find((c: { id: string }) =>
      c.id.startsWith("place")
    )?.text;

    return { latitude, longitude, city };
  } catch {
    return getSanDiegoZipFallback(zipCode);
  }
}

function getSanDiegoZipFallback(
  zipCode: string
): { latitude: number; longitude: number; city?: string } | null {
  // Approximate center of San Diego County for dev without Mapbox
  const offsets: Record<string, { lat: number; lng: number; city: string }> = {
    "92007": { lat: 33.0231, lng: -117.281, city: "Cardiff" },
    "92024": { lat: 33.0369, lng: -117.2919, city: "Encinitas" },
    "92069": { lat: 33.1434, lng: -117.1661, city: "San Marcos" },
    "92075": { lat: 33.037, lng: -117.2746, city: "Solana Beach" },
    "92081": { lat: 33.2, lng: -117.2425, city: "Vista" },
    "92101": { lat: 32.7157, lng: -117.1611, city: "San Diego" },
    "92109": { lat: 32.7978, lng: -117.2544, city: "Pacific Beach" },
  };

  const match = offsets[zipCode];
  if (match) {
    return { latitude: match.lat, longitude: match.lng, city: match.city };
  }

  return { latitude: 33.045, longitude: -117.275, city: "North San Diego County" };
}

export function isInSanDiegoCounty(zipCode: string): boolean {
  // Basic validation — expand with full zip list check in production
  return zipCode.startsWith("92") || zipCode.startsWith("919") || zipCode.startsWith("920");
}
