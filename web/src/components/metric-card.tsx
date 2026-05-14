interface MetricCardProps {
  label: string;
  value: number;
  accent?: "confirmed" | "probable" | "death" | "monitoring" | "neutral";
  sublabel?: string;
}

// Accent-colored border tint per metric (matches map color coding)
const accentClasses: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  confirmed: "border-red-200 dark:border-red-900/50",
  probable: "border-purple-200 dark:border-purple-900/50",
  death: "border-slate-300 dark:border-slate-700",
  monitoring: "border-orange-200 dark:border-orange-900/50",
  neutral: "border-border",
};

// Number color
const valueClasses: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  confirmed: "text-red-600 dark:text-red-400",
  probable: "text-purple-600 dark:text-purple-400",
  death: "text-slate-900 dark:text-slate-100",
  monitoring: "text-orange-600 dark:text-orange-400",
  neutral: "",
};

// Label tint — same as the map color coding, but deaths stays muted
// because slate-900 black on small uppercase text is unreadable.
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
    <div
      className={`group relative overflow-hidden rounded-xl border bg-background/40 backdrop-blur-xl backdrop-saturate-150 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)] ring-1 ring-black/5 dark:ring-white/10 transition-transform hover:-translate-y-0.5 hover:shadow-[0_14px_36px_-12px_rgba(0,0,0,0.32)] ${accentClasses[accent]}`}
    >
      {/* Top-edge specular highlight — simulates light catching the bevel */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/20" />
      {/* Diagonal sheen from top-left */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/[0.04]" />
      <div className="relative p-4">
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
      </div>
    </div>
  );
}
