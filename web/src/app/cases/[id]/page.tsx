import { notFound } from "next/navigation";
import Link from "next/link";
import casesData from "@/data/cases.json";
import type { Case } from "@/lib/types";
import { CaseBadge } from "@/components/case-badge";
import { countryName } from "@/data/country-coords";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const cases = casesData as Case[];

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return cases.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const c = cases.find((c) => c.id === id);
  if (!c) return { title: "Case not found" };
  const country =
    c.country === "XX" ? "Multiple countries" : countryName(c.country);
  return {
    title: `${country} · ${c.case_type} (${c.case_count}) · Hondius Tracker`,
    description: c.notes,
  };
}

export default async function CaseDetailPage({ params }: Props) {
  const { id } = await params;
  const c = cases.find((c) => c.id === id);
  if (!c) notFound();

  const country =
    c.country === "XX" ? "Multiple countries" : countryName(c.country);

  // "Related cases" = other rows in the same country (proxy for cluster).
  // Once cluster_id lands in the v1 schema, switch to grouping by that.
  const related = cases
    .filter((other) => other.id !== c.id && other.country === c.country && c.country !== "XX")
    .slice(0, 4);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-3xl">
      <p className="text-sm">
        <Link
          href="/cases"
          className="text-muted-foreground hover:text-foreground underline"
        >
          ← All cases
        </Link>
      </p>

      <header className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <CaseBadge type={c.case_type} />
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            Current status: {c.current_status.replace(/_/g, " ")}
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          {c.case_count} {c.case_count === 1 ? "individual" : "individuals"} —{" "}
          {country}
          {c.admin1 ? ` (${c.admin1})` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          Reported {c.date_reported}
        </p>
      </header>

      <Card className="p-5">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Notes
        </h2>
        <p className="mt-2 text-foreground leading-relaxed">{c.notes}</p>
      </Card>

      <section>
        <h2 className="text-lg font-semibold mb-3">
          Sources ({c.source_articles.length})
        </h2>
        <ul className="space-y-2">
          {c.source_articles.map((src) => (
            <li key={src.url}>
              <a
                href={src.url}
                target="_blank"
                rel="noopener"
                className="block group"
              >
                <Card className="p-3 transition-colors group-hover:border-foreground/30">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {src.source_name}
                  </p>
                  <p className="mt-1 text-sm font-medium group-hover:underline">
                    {src.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground truncate">
                    {src.url}
                  </p>
                </Card>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {related.length > 0 && (
        <>
          <Separator />
          <section>
            <h2 className="text-lg font-semibold mb-3">
              Related cases in {country}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/cases/${r.id}`}
                  className="block group"
                >
                  <Card className="p-3 transition-colors group-hover:border-foreground/30">
                    <div className="flex items-center justify-between gap-2">
                      <CaseBadge type={r.case_type} />
                      <span className="text-xs text-muted-foreground">
                        {r.date_reported}
                      </span>
                    </div>
                    <p className="mt-2 text-sm line-clamp-2">{r.notes}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
