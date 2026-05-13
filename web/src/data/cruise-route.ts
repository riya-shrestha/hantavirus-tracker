// MV Hondius itinerary (April 1, 2026 -> May 10, 2026)
export interface RouteWaypoint {
  name: string;
  lat: number;
  lng: number;
  date: string; // ISO
}

export const cruiseRoute: RouteWaypoint[] = [
  {
    name: "Ushuaia, Argentina (departure)",
    lat: -54.8,
    lng: -68.3,
    date: "2026-04-01",
  },
  {
    name: "South Georgia Island",
    lat: -54.4,
    lng: -36.5,
    date: "2026-04-08",
  },
  {
    name: "Tristan da Cunha",
    lat: -37.1,
    lng: -12.3,
    date: "2026-04-14",
  },
  {
    name: "Saint Helena",
    lat: -15.9,
    lng: -5.7,
    date: "2026-04-24",
  },
  {
    name: "Ascension Island",
    lat: -7.9,
    lng: -14.4,
    date: "2026-04-28",
  },
  {
    name: "Cape Verde",
    lat: 16.0,
    lng: -23.5,
    date: "2026-05-04",
  },
  {
    name: "Tenerife (Canary Islands, Spain) - arrival",
    lat: 28.3,
    lng: -16.5,
    date: "2026-05-10",
  },
];
