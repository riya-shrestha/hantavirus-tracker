import { Badge } from "@/components/ui/badge";
import type { CaseType } from "@/lib/types";

const styles: Record<CaseType, string> = {
  confirmed:
    "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-900/50",
  probable:
    "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-900/50",
  suspected:
    "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/50",
  contact_monitoring:
    "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/50",
  death:
    "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100",
};

const labels: Record<CaseType, string> = {
  confirmed: "Confirmed",
  probable: "Probable",
  suspected: "Suspected",
  contact_monitoring: "Monitoring",
  death: "Death",
};

export function CaseBadge({ type }: { type: CaseType }) {
  return (
    <Badge variant="outline" className={`${styles[type]} font-medium`}>
      {labels[type]}
    </Badge>
  );
}
