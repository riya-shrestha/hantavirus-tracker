import casesData from "@/data/cases.json";
import type { Case } from "@/lib/types";
import { CaseCard } from "@/components/case-card";

const cases = casesData as Case[];

export const metadata = {
  title: "Cases · MV Hondius Outbreak Tracker",
  description: "All cases linked to the 2026 MV Hondius Andes virus cluster.",
};

export default function CasesPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-6xl">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">All cases</h1>
        <p className="text-muted-foreground">
          {cases.length} case rows across {new Set(cases.map((c) => c.country).filter(c => c !== "XX")).size}{" "}
          countries. Filtering UI coming in v1.1.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {cases.map((c) => (
          <CaseCard key={c.id} caseRow={c} />
        ))}
      </div>
    </div>
  );
}
