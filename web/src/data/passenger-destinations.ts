// Places Hondius passengers ended up after the cruise — drawn from CDC HAN
// HAN00528 (US states monitoring returning passengers), WHO 2026-DON600
// (countries where passengers were hospitalized), and ECDC updates.
// Yellow markers on the map show these locations where there's no case or
// monitoring marker already.

export interface PassengerDestination {
  country: string;
  admin1?: string;
  lat: number;
  lng: number;
  label: string;
  note: string;
}

export const passengerDestinations: PassengerDestination[] = [
  // US states monitoring returning passengers per CDC HAN HAN00528
  // (NE / GA / NJ already shown via case or monitoring markers)
  {
    country: "US",
    admin1: "TX",
    lat: 31.0,
    lng: -100.0,
    label: "Texas",
    note: "US state monitoring returning Hondius passengers",
  },
  {
    country: "US",
    admin1: "AZ",
    lat: 34.2,
    lng: -111.7,
    label: "Arizona",
    note: "US state monitoring returning Hondius passengers",
  },
  {
    country: "US",
    admin1: "CA",
    lat: 36.7,
    lng: -119.4,
    label: "California",
    note: "US state monitoring returning Hondius passengers",
  },
  {
    country: "US",
    admin1: "VA",
    lat: 37.4,
    lng: -78.7,
    label: "Virginia",
    note: "US state monitoring returning Hondius passengers",
  },
  {
    country: "US",
    admin1: "UT",
    lat: 39.3,
    lng: -111.7,
    label: "Utah",
    note: "US state monitoring returning Hondius passengers",
  },
  // International passenger destinations not already covered by case markers
  {
    country: "ZA",
    lat: -30.0,
    lng: 22.0,
    label: "South Africa",
    note: "Dutch passenger hospitalized in Johannesburg",
  },
  {
    country: "AR",
    lat: -38.4,
    lng: -63.6,
    label: "Argentina",
    note: "MV Hondius departure point (Ushuaia, Apr 1)",
  },
  {
    country: "ES",
    lat: 40.4,
    lng: -3.7,
    label: "Spain",
    note: "Ship docked at Tenerife, Canary Islands, May 10",
  },
  {
    country: "FR",
    lat: 46.2,
    lng: 2.2,
    label: "France",
    note: "Passenger hospitalization location per ECDC",
  },
  {
    country: "CV",
    lat: 16.0,
    lng: -23.5,
    label: "Cape Verde",
    note: "Port of call before Tenerife",
  },
  {
    country: "SG",
    lat: 1.35,
    lng: 103.8,
    label: "Singapore",
    note: "Country with passengers on the original Hondius cruise",
  },
];
