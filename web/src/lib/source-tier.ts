// Source-tier rubric — used by /sources page and the map's hover card.
// Will move to /pipeline/sources.yml when the Python ingestion lands.

import type { Case } from "@/lib/types";

export type Tier = 1 | 2 | 3 | 4;

const TIER_HINTS: Record<string, Tier> = {
  "CDC HAN": 1,
  "WHO DON": 1,
  ECDC: 1,
  PAHO: 1,
  RIVM: 1,
  RKI: 1,
  BAG: 1,
  NICD: 1,
  UKHSA: 1,
  Reuters: 2,
  AP: 2,
  NPR: 2,
  CNN: 2,
  BBC: 2,
  NYT: 2,
  TODAY: 2,
  ProMED: 3,
  HealthMap: 3,
};

/**
 * Map a `source_name` (free-form string in cases.json) to its tier.
 * Direct lookup, then case-insensitive prefix match (e.g., "Reuters Health"
 * matches "Reuters"). Falls back to 4 for unknowns.
 */
export function tierOf(sourceName: string): Tier {
  if (sourceName in TIER_HINTS) return TIER_HINTS[sourceName];
  const lower = sourceName.toLowerCase();
  for (const [hint, tier] of Object.entries(TIER_HINTS)) {
    if (lower.includes(hint.toLowerCase())) return tier;
  }
  return 4;
}

/**
 * Tailwind classes for the tier badge (light + dark variants).
 */
export function tierClasses(t: Tier | number): string {
  switch (t) {
    case 1:
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50";
    case 2:
      return "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/50";
    case 3:
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/50";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300";
  }
}

export interface RankedSource {
  url: string;
  source_name: string;
  title: string;
  tier: Tier;
  caseId: string;
  caseDate: string; // ISO yyyy-mm-dd
}

/**
 * Pick the top N sources to surface in the map's hover card.
 *
 * Rule (per Riya):
 *   - Slot 1 = the single most-recent article by case `date_reported`.
 *   - Slots 2..N = remaining articles ranked by tier ascending (1 best),
 *     then by case date descending.
 * Sources are deduplicated by URL across all contributing case rows.
 */
export function pickTopSources(cases: Case[], max = 3): RankedSource[] {
  const all: RankedSource[] = [];
  const seen = new Set<string>();

  for (const c of cases) {
    for (const src of c.source_articles) {
      if (seen.has(src.url)) continue;
      seen.add(src.url);
      all.push({
        url: src.url,
        source_name: src.source_name,
        title: src.title,
        tier: tierOf(src.source_name),
        caseId: c.id,
        caseDate: c.date_reported,
      });
    }
  }

  if (all.length === 0) return [];

  // Slot 1: most recent overall (break ties by tier, then by source_name).
  const byRecency = [...all].sort(
    (a, b) =>
      b.caseDate.localeCompare(a.caseDate) ||
      a.tier - b.tier ||
      a.source_name.localeCompare(b.source_name),
  );
  const slotOne = byRecency[0];

  if (max === 1) return [slotOne];

  // Slots 2..N: from remaining, rank by tier asc, then date desc.
  const remaining = all.filter((s) => s.url !== slotOne.url);
  remaining.sort(
    (a, b) =>
      a.tier - b.tier ||
      b.caseDate.localeCompare(a.caseDate) ||
      a.source_name.localeCompare(b.source_name),
  );

  return [slotOne, ...remaining.slice(0, max - 1)];
}

/**
 * Total unique source URLs across all contributing case rows.
 */
export function totalSourceCount(cases: Case[]): number {
  const set = new Set<string>();
  for (const c of cases) {
    for (const src of c.source_articles) set.add(src.url);
  }
  return set.size;
}
