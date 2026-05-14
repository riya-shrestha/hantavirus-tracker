import { Card } from "@/components/ui/card";

interface MetricCardProps {
  label: string;
  value: number;
  accent?: "confirmed" | "probable" | "death" | "monitoring" | "neutral";
  sublabel?: string;
}

// Card border tint per accent
const accentClasses: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  confirmed: "border-red-200 dark:border-red-900/40",
  probable: "border-purple-200 dark:border-purple-900/40",
  death: "border-slate-300 dark:border-slate-700",
  monitoring: "border-orange-200 dark:border-orange-900/40",
  neutral: "",
};

// Number color — matches map marker color
const valueClasses: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  confirmed: "text-red-600 dark:text-red-400",
  probable: "text-purple-600 dark:text-purple-400",
  death: "text-slate-900 dark:text-slate-100",
  monitoring: "text-orange-600 dark:text-orange-400",
  neutral: "",
};

// Label tint — matches map color coding, EXCEPT death which stays muted
// because slate-900 black would be unreadable for a small uppercase label.
const labelClasses: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  confirmed: "text-red-600 dark:text-red-400",
  probable: "text-purple-600 dark:text-purple-400",
  death: "text-muted-foreground",
  monitoring: "text-orange-600 dark:text-orange-400",
  neutral: "text-muted-foreground",
};

export function MetricCard({
  label,
  value,
  accent = "neutral",
  sublabel,
}: MetricCardProps) {
  return (
    <Card className={`p-4 ${accentClasses[accent]}`}>
      <p
        className={`text-xs font-medium uppercase tracking-wide ${labelClasses[accent]}`}
      >
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
