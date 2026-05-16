export type CaseType =
  | "confirmed"
  | "probable"
  | "suspected"
  | "contact_monitoring"
  | "death";

export type CurrentStatus =
  | "confirmed"
  | "suspected_unresolved"
  | "excluded"
  | "deceased";

export type DeathClassification = "confirmed" | "probable";

export type LocationSpecificity =
  | "city"
  | "admin1"
  | "country"
  | "unknown"
  | "at_sea";

export interface SourceArticle {
  url: string;
  source_name: string;
  title: string;
}

export interface Case {
  id: string;
  schema_version: number;
  // Attribution country / state — typically nationality. Used for headline
  // counts and case-list display.
  country: string;
  admin1: string | null;
  case_type: CaseType;
  current_status: CurrentStatus;
  death_classification?: DeathClassification | null; // only for case_type='death'
  case_count: number;
  date_reported: string;
  // PHYSICAL location — where the case actually is / was. May diverge from
  // attribution country (e.g., a Dutch national who died in Johannesburg).
  // Used for map plotting.
  location_specificity?: LocationSpecificity;
  location_country?: string | null; // ISO-2; null falls back to `country`
  location_admin1?: string | null;
  location_city?: string | null; // slug, e.g., "omaha"
  location_lat?: number | null;
  location_lng?: number | null;
  source_articles: SourceArticle[];
  notes: string;
}

export interface HeadlineCounts {
  confirmed: number;
  probable: number;
  suspected: number;
  deaths: number;
  monitoring: number;
}

export function computeHeadline(cases: Case[]): HeadlineCounts {
  // Cases with current_status='excluded' are operationally cleared (e.g., a
  // previously-positive lab result superseded by a negative re-test).
  // They retain their original case_type for audit / methodology purposes
  // but are not counted toward the active headline numbers.
  const activeCases = cases.filter((c) => c.current_status !== "excluded");
  const sum = (type: CaseType) =>
    activeCases
      .filter((c) => c.case_type === type)
      .reduce((s, c) => s + c.case_count, 0);
  return {
    confirmed: sum("confirmed"),
    probable: sum("probable"),
    suspected: sum("suspected"),
    deaths: sum("death"),
    monitoring: sum("contact_monitoring"),
  };
}
