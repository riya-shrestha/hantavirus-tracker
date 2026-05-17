import casesData from "@/data/cases.json";
import { type Case, computeHeadline } from "@/lib/types";
import { CaseMapLazy } from "@/components/case-map-lazy";
import { MetricCard } from "@/components/metric-card";
import { CaseCard } from "@/components/case-card";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

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
          counts match WHO 2026-DON601 (May 13, 2026).
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
        active cases per{" "}
        <a
          href="https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON601"
          className="underline hover:text-foreground"
          target="_blank"
          rel="noopener"
        >
          WHO 2026-DON601
        </a>{" "}
        and{" "}
        <a
          href="https://www.ecdc.europa.eu/en/infectious-disease-topics/hantavirus-infection/surveillance-and-updates/andes-hantavirus-outbreak"
          className="underline hover:text-foreground"
          target="_blank"
          rel="noopener"
        >
          ECDC May 17
        </a>{" "}
        (incl. the May 15 Canadian-passenger positive)
        . One previously-included US case has been cleared by negative re-test
        (see case-005). Contact-monitoring population (
        <span className="font-medium">{h.monitoring}</span> across the US and
        partner countries per CDC) tracked separately because asymptomatic
        contacts are not part of the official case tally.
      </p>

      <section aria-label="World map">
        <CaseMapLazy cases={cases} />
      </section>

      <section aria-label="All cases">
        <details className="group rounded-lg border border-border bg-card/40">
          <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between gap-3 hover:bg-muted/40 rounded-lg group-open:rounded-b-none transition-colors">
            <div className="flex items-baseline gap-3">
              <h2 className="text-xl font-semibold tracking-tight">
                All cases
              </h2>
              <span className="text-sm text-muted-foreground">
                {cases.length} row{cases.length === 1 ? "" : "s"}
              </span>
            </div>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="hidden sm:inline group-open:hidden">
                Show
              </span>
              <span className="hidden sm:group-open:inline">Hide</span>
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
            </span>
          </summary>
          <div className="px-4 pb-4 pt-1 space-y-3">
            <div className="flex items-center justify-end">
              <Link
                href="/cases"
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Full filterable list →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {cases.map((c) => (
                <CaseCard key={c.id} caseRow={c} />
              ))}
            </div>
          </div>
        </details>
      </section>
    </div>
  );
}
