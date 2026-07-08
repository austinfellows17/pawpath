export function isMapboxConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim());
}

export async function verifyMapboxToken(token: string) {
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/92024.json?country=US&types=postcode&access_token=${token}`
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Mapbox API returned ${response.status}`);
  }

  const data = await response.json();
  if (!data.features?.length) {
    throw new Error("Mapbox token works but returned no results for test zip 92024");
  }

  return data.features[0].place_name as string;
}
