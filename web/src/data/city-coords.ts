// City centroids for the cities currently referenced by case rows. Hand-
// curated for v1.1; once the Python/TypeScript pipeline is live this will
// be replaced by a Postgres `cities` table loaded from GeoNames cities1000.
//
// Lat/lng from official municipality coordinates (rounded to 4dp).

export interface CityInfo {
  display_name: string;
  country: string; // ISO-2
  admin1: string | null; // US state code, etc.
  lat: number;
  lng: number;
}

// Lookup key: lowercase slug, optionally `slug|country` for disambiguation
// (e.g., two "Springfield"s would need country qualifier).
export const cityCoords: Record<string, CityInfo> = {
  johannesburg: {
    display_name: "Johannesburg",
    country: "ZA",
    admin1: null,
    lat: -26.2041,
    lng: 28.0473,
  },
  zurich: {
    display_name: "Zurich",
    country: "CH",
    admin1: null,
    lat: 47.3769,
    lng: 8.5417,
  },
  omaha: {
    display_name: "Omaha",
    country: "US",
    admin1: "NE",
    lat: 41.2565,
    lng: -95.9345,
  },
  atlanta: {
    display_name: "Atlanta",
    country: "US",
    admin1: "GA",
    lat: 33.749,
    lng: -84.388,
  },
  "santa-cruz-de-tenerife": {
    display_name: "Santa Cruz de Tenerife",
    country: "ES",
    admin1: null,
    lat: 28.4636,
    lng: -16.2518,
  },
  "tristan-da-cunha": {
    display_name: "Tristan da Cunha (Edinburgh of the Seven Seas)",
    country: "SH",
    admin1: null,
    lat: -37.0686,
    lng: -12.311,
  },
};

export function cityBySlug(slug: string): CityInfo | undefined {
  return cityCoords[slug.toLowerCase()];
}

export function cityDisplayName(slug: string): string {
  return cityCoords[slug.toLowerCase()]?.display_name ?? slug;
}
