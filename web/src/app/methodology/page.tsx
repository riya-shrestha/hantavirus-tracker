import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Methodology · MV Hondius Outbreak Tracker",
  description:
    "Case definitions, inclusion criteria, data sources, and counting conventions used to compile the Hondius outbreak tracker.",
};

export default function MethodologyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-8 prose-headings:tracking-tight">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Methodology</h1>
        <p className="text-muted-foreground">
          How cases get into this tracker, how they&apos;re classified, and
          what&apos;s explicitly out of scope.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Inclusion criteria</h2>
        <p className="text-foreground/90 leading-relaxed">
          A case is included if and only if it is{" "}
          <strong>demonstrably linked to the MV Hondius cluster</strong> — i.e.,
          the person was a passenger or crew member on the MV Hondius, OR is a
          documented human-to-human secondary transmission from a Hondius case.
        </p>
        <p className="text-foreground/90 leading-relaxed">
          Endemic Andes virus cases in Argentina/Chile that are not connected
          to the cruise are <strong>explicitly excluded</strong>. So are other
          hantavirus strains (Sin Nombre, etc.) that don&apos;t transmit
          human-to-human.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Case classifications</h2>
        <p className="text-foreground/90 leading-relaxed">
          Following WHO/ECDC convention:
        </p>
        <Card className="p-4">
          <dl className="space-y-3">
            <div>
              <dt className="font-medium text-sm">Confirmed</dt>
              <dd className="text-sm text-muted-foreground mt-0.5">
                Lab-positive for Andes virus.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-sm">Probable</dt>
              <dd className="text-sm text-muted-foreground mt-0.5">
                Clinically diagnosed; lab pending or negative but with a
                consistent epidemiological link.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-sm">Suspected</dt>
              <dd className="text-sm text-muted-foreground mt-0.5">
                Symptomatic with no lab work yet.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-sm">Contact monitoring</dt>
              <dd className="text-sm text-muted-foreground mt-0.5">
                Asymptomatic, exposed, under public-health watch.{" "}
                <strong>Not counted in the headline total</strong> — matches
                WHO/ECDC convention of counting only people with clinical or
                lab evidence of disease.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-sm">Death</dt>
              <dd className="text-sm text-muted-foreground mt-0.5">
                Deceased (confirmed or probable).
              </dd>
            </div>
          </dl>
        </Card>
        <p className="text-sm text-muted-foreground">
          The headline total = <code className="font-mono">confirmed + probable + death</code>,
          which currently matches{" "}
          <a
            href="https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON600"
            className="underline hover:text-foreground"
            target="_blank"
            rel="noopener"
          >
            WHO 2026-DON600
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Source tiers</h2>
        <Card className="p-4">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-medium">Tier 1 — official health agencies</dt>
              <dd className="text-muted-foreground mt-0.5">
                WHO, CDC, ECDC, PAHO, and national health agencies (RIVM, RKI,
                BAG, NICD, UKHSA, US state health departments). Basis of all
                headline counts.
              </dd>
            </div>
            <div>
              <dt className="font-medium">Tier 2 — major news with health desks</dt>
              <dd className="text-muted-foreground mt-0.5">
                Reuters, AP, NPR, CNN, BBC, NYT, FT, Washington Post,
                Guardian, and regional equivalents.
              </dd>
            </div>
            <div>
              <dt className="font-medium">Tier 3 — expert-curated informal</dt>
              <dd className="text-muted-foreground mt-0.5">
                ProMED-mail, HealthMap, CIDRAP.
              </dd>
            </div>
            <div>
              <dt className="font-medium">Tier 4 — aggregators / blogs</dt>
              <dd className="text-muted-foreground mt-0.5">
                Not counted toward headline.
              </dd>
            </div>
          </dl>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Counting conventions</h2>
        <ul className="list-disc pl-6 space-y-2 text-sm text-foreground/90">
          <li>
            <strong>One row per named individual.</strong> Where reporting
            describes an unnamed group (&quot;15 passengers monitored at
            UNMC&quot;), a single aggregate row is used with{" "}
            <code className="font-mono text-xs px-1 bg-muted rounded">
              case_count
            </code>{" "}
            set to the group size and notes describing the cluster.
          </li>
          <li>
            <strong>Country = primary attribution from official reporting.</strong>{" "}
            Typically nationality (the Dutch couple is <code>NL</code>{" "}
            regardless of where they died). Location of treatment is noted in
            the case row but doesn&apos;t change the country code.
          </li>
          <li>
            <strong>
              <code className="font-mono text-xs px-1 bg-muted rounded">
                case_type
              </code>{" "}
              is frozen
            </strong>{" "}
            at original classification. The{" "}
            <code className="font-mono text-xs px-1 bg-muted rounded">
              current_status
            </code>{" "}
            field updates over time as situations develop.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Known limitations (v0.5)</h2>
        <ul className="list-disc pl-6 space-y-2 text-sm text-foreground/90">
          <li>
            <strong>Hand-curated.</strong> A human is reading articles and
            transcribing cases. The v1 roadmap automates this with LLM
            extraction from RSS feeds and a manual review queue.
          </li>
          <li>
            <strong>One aggregate row</strong> currently represents 5 cases
            from WHO 2026-DON600 whose individual locations aren&apos;t
            publicly identified in the trusted-source reporting we&apos;ve
            indexed. They will be split out as country-specific confirmations
            land.
          </li>
          <li>
            <strong>No transmission-chain graph yet.</strong> Edges between
            cases (e.g., index-passenger → contact) aren&apos;t modeled in
            v1.0; coming in v1.1.
          </li>
        </ul>
      </section>
    </div>
  );
}
