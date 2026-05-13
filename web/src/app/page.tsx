import casesData from "@/data/cases.json";
import { type Case, computeHeadline } from "@/lib/types";
import { CaseMapLazy } from "@/components/case-map-lazy";
import { MetricCard } from "@/components/metric-card";
import { CaseCard } from "@/components/case-card";
import Link from "next/link";

const cases = casesData as Case[];

export default function Home() {
  const h = computeHeadline(cases);
  const headlineTotal = h.confirmed + h.probable + h.deaths;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-6xl">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Outbreak tracker · v0.5 (frontend migration in progress)
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          MV Hondius / Andes Virus 2026 Outbreak
        </h1>
        <p className="text-base text-muted-foreground max-w-3xl">
          Tracking the human-to-human Andes virus cluster from the April 2026
          MV Hondius cruise ship outbreak. Cases below are hand-curated from
          tier-1 health agencies (WHO, CDC, ECDC) and major news outlets;
          counts match WHO 2026-DON600.
        </p>
      </header>

      <section
        aria-label="Headline metrics"
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <MetricCard
          label="Confirmed"
          value={h.confirmed}
          accent="confirmed"
          sublabel="lab-positive"
        />
        <MetricCard
          label="Probable"
          value={h.probable}
          accent="probable"
          sublabel="clinically diagnosed"
        />
        <MetricCard
          label="Deaths"
          value={h.deaths}
          accent="death"
          sublabel="confirmed + probable"
        />
        <MetricCard
          label="Under monitoring"
          value={h.monitoring}
          accent="monitoring"
          sublabel="asymptomatic contacts"
        />
      </section>

      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{headlineTotal}</span>{" "}
        total cases per{" "}
        <a
          href="https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON600"
          className="underline hover:text-foreground"
          target="_blank"
          rel="noopener"
        >
          WHO 2026-DON600
        </a>
        . Contact-monitoring population is tracked separately because asymptomatic
        contacts are not part of the official case tally.
      </p>

      <section aria-label="World map">
        <CaseMapLazy cases={cases} />
        <p className="mt-2 text-xs text-muted-foreground">
          MapLibre GL + OpenFreeMap vector tiles (no API key). Toggle
          between 3D globe (drag to rotate freely) and 2D Mercator
          (infinite horizontal scroll). US cases split by state (NE / GA /
          NJ) — each region marked by a proportional circle sized by case
          count, colored by worst-severity (slate = deaths, red = confirmed,
          purple = probable, blue = monitoring). Orange dashed line traces
          the MV Hondius cruise route (Ushuaia → Tenerife, Apr 1 – May 10,
          2026).
        </p>
      </section>

      <section aria-label="Recent cases" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">All cases</h2>
          <Link
            href="/cases"
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Full filterable list →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {cases.map((c) => (
            <CaseCard key={c.id} caseRow={c} />
          ))}
        </div>
      </section>
    </div>
  );
}
