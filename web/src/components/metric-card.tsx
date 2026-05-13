import { Card } from "@/components/ui/card";

interface MetricCardProps {
  label: string;
  value: number;
  accent?: "confirmed" | "probable" | "death" | "monitoring" | "neutral";
  sublabel?: string;
}

const accentClasses: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  confirmed: "border-red-200 dark:border-red-900/40",
  probable: "border-purple-200 dark:border-purple-900/40",
  death: "border-slate-300 dark:border-slate-700",
  monitoring: "border-blue-200 dark:border-blue-900/40",
  neutral: "",
};

const valueClasses: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  confirmed: "text-red-600 dark:text-red-400",
  probable: "text-purple-600 dark:text-purple-400",
  death: "text-slate-900 dark:text-slate-100",
  monitoring: "text-blue-600 dark:text-blue-400",
  neutral: "",
};

export function MetricCard({
  label,
  value,
  accent = "neutral",
  sublabel,
}: MetricCardProps) {
  return (
    <Card className={`p-4 ${accentClasses[accent]}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-2 text-3xl font-semibold tabular-nums ${valueClasses[accent]}`}
      >
        {value}
      </p>
      {sublabel && (
        <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>
      )}
    </Card>
  );
}
