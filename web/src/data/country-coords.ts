// Country centroids (approx) for globe bars. Aggregate row uses "XX".
export interface CountryInfo {
  name: string;
  iso3: string;
  lat: number;
  lng: number;
}

export const countryCoords: Record<string, CountryInfo> = {
  US: { name: "United States", iso3: "USA", lat: 39.8, lng: -98.6 },
  CH: { name: "Switzerland", iso3: "CHE", lat: 46.8, lng: 8.2 },
  DE: { name: "Germany", iso3: "DEU", lat: 51.2, lng: 10.5 },
  NL: { name: "Netherlands", iso3: "NLD", lat: 52.4, lng: 5.3 },
  GB: { name: "United Kingdom", iso3: "GBR", lat: 54.0, lng: -2.5 },
  ZA: { name: "South Africa", iso3: "ZAF", lat: -30.0, lng: 22.0 },
  AR: { name: "Argentina", iso3: "ARG", lat: -38.4, lng: -63.6 },
  SG: { name: "Singapore", iso3: "SGP", lat: 1.35, lng: 103.8 },
  CV: { name: "Cape Verde", iso3: "CPV", lat: 16.0, lng: -23.5 },
  ES: { name: "Spain", iso3: "ESP", lat: 40.4, lng: -3.7 },
  FR: { name: "France", iso3: "FRA", lat: 46.2, lng: 2.2 },
};

export function countryName(code: string): string {
  return countryCoords[code]?.name ?? code;
}
