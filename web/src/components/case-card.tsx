import Link from "next/link";
import { Card } from "@/components/ui/card";
import { CaseBadge } from "@/components/case-badge";
import { countryName } from "@/data/country-coords";
import type { Case } from "@/lib/types";

export function CaseCard({ caseRow }: { caseRow: Case }) {
  const country =
    caseRow.country === "XX"
      ? "Multiple (aggregate)"
      : countryName(caseRow.country);
  const region = caseRow.admin1 ? ` · ${caseRow.admin1}` : "";

  return (
    <Link href={`/cases/${caseRow.id}`} className="block group">
      <Card className="p-4 h-full transition-colors group-hover:border-foreground/30">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {country}
              {region}
            </p>
            <p className="mt-1 text-base font-semibold">
              {caseRow.case_count}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                {caseRow.case_count === 1 ? "individual" : "individuals"}
              </span>
            </p>
          </div>
          <CaseBadge type={caseRow.case_type} />
        </div>

        <p className="mt-3 text-sm text-foreground/80 line-clamp-3">
          {caseRow.notes}
        </p>

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Reported {caseRow.date_reported}</span>
          <span>
            {caseRow.source_articles.length}{" "}
            {caseRow.source_articles.length === 1 ? "source" : "sources"}
          </span>
        </div>
      </Card>
    </Link>
  );
}
