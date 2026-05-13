import casesData from "@/data/cases.json";
import type { Case } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const cases = casesData as Case[];

export const metadata = {
  title: "Sources · MV Hondius Outbreak Tracker",
  description:
    "Every news article and official report used to compile the Hondius outbreak tracker.",
};

// Tier rubric, kept inline for v1.0. Will move to /pipeline/sources.yml when the
// Python pipeline lands.
const TIER_HINTS: { [key: string]: 1 | 2 | 3 | 4 } = {
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

function tierOf(sourceName: string): 1 | 2 | 3 | 4 {
  // Direct match
  if (sourceName in TIER_HINTS) return TIER_HINTS[sourceName];
  // Prefix match (e.g., "Reuters Health" -> Reuters)
  for (const [hint, tier] of Object.entries(TIER_HINTS)) {
    if (sourceName.toLowerCase().includes(hint.toLowerCase())) return tier;
  }
  return 4;
}

function tierClasses(t: number) {
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

export default function SourcesPage() {
  // Aggregate by source name, count case references and collect URLs
  const bySource: Record<
    string,
    { count: number; urls: Set<string>; tier: number }
  > = {};

  for (const c of cases) {
    for (const src of c.source_articles) {
      const entry = (bySource[src.source_name] ??= {
        count: 0,
        urls: new Set(),
        tier: tierOf(src.source_name),
      });
      entry.count++;
      entry.urls.add(src.url);
    }
  }

  // All unique source articles for the per-article list
  const allArticles = new Map<
    string,
    { url: string; title: string; source_name: string; tier: number; usedIn: number }
  >();
  for (const c of cases) {
    for (const src of c.source_articles) {
      const key = src.url;
      const existing = allArticles.get(key);
      if (existing) {
        existing.usedIn++;
      } else {
        allArticles.set(key, {
          url: src.url,
          title: src.title,
          source_name: src.source_name,
          tier: tierOf(src.source_name),
          usedIn: 1,
        });
      }
    }
  }

  const sortedSources = Object.entries(bySource).sort(
    (a, b) => b[1].count - a[1].count,
  );
  const sortedArticles = Array.from(allArticles.values()).sort(
    (a, b) => a.tier - b.tier || b.usedIn - a.usedIn,
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-4xl">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Sources</h1>
        <p className="text-muted-foreground">
          Every news article and official report referenced in{" "}
          <code className="font-mono text-xs px-1 py-0.5 bg-muted rounded">
            data/cases.json
          </code>
          . Grouped by source, with tier badges.
        </p>
      </header>

      <section>
        <h2 className="text-lg font-semibold mb-3">By source</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sortedSources.map(([name, info]) => (
            <Card key={name} className="p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{name}</p>
                <Badge
                  variant="outline"
                  className={`${tierClasses(info.tier)} font-medium`}
                >
                  Tier {info.tier}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Used in {info.count} case{info.count === 1 ? "" : "s"} ·{" "}
                {info.urls.size} unique article
                {info.urls.size === 1 ? "" : "s"}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">
          All articles ({sortedArticles.length})
        </h2>
        <ul className="space-y-2">
          {sortedArticles.map((a) => (
            <li key={a.url}>
              <a href={a.url} target="_blank" rel="noopener" className="block group">
                <Card className="p-3 transition-colors group-hover:border-foreground/30">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {a.source_name}
                    </p>
                    <Badge
                      variant="outline"
                      className={`${tierClasses(a.tier)} font-medium text-[10px]`}
                    >
                      T{a.tier}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm font-medium group-hover:underline">
                    {a.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground truncate">
                    {a.url}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Used in {a.usedIn} case{a.usedIn === 1 ? "" : "s"}
                  </p>
                </Card>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
