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

export interface SourceArticle {
  url: string;
  source_name: string;
  title: string;
}

export interface Case {
  id: string;
  schema_version: number;
  country: string;
  admin1: string | null;
  case_type: CaseType;
  current_status: CurrentStatus;
  case_count: number;
  date_reported: string;
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
  const sum = (type: CaseType) =>
    cases
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
