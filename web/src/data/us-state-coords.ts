// US state centroids for plotting state-level case bars on the globe.
// Only the states we currently have data for; extend as needed.
export interface USStateInfo {
  name: string;
  lat: number;
  lng: number;
}

export const usStateCoords: Record<string, USStateInfo> = {
  // States with cases
  NE: { name: "Nebraska", lat: 41.5, lng: -99.9 },
  GA: { name: "Georgia", lat: 32.6, lng: -83.5 },
  NJ: { name: "New Jersey", lat: 40.1, lng: -74.7 },
  // Other states monitoring returning passengers (CDC HAN) — included so the
  // dataset can grow into them without re-edits.
  TX: { name: "Texas", lat: 31.0, lng: -100.0 },
  AZ: { name: "Arizona", lat: 34.2, lng: -111.7 },
  CA: { name: "California", lat: 36.7, lng: -119.4 },
  VA: { name: "Virginia", lat: 37.4, lng: -78.7 },
  UT: { name: "Utah", lat: 39.3, lng: -111.7 },
};

export function usStateName(code: string): string {
  return usStateCoords[code]?.name ?? code;
}
