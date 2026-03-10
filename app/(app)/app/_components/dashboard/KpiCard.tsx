type KpiCardProps = {
  label: string;
  value: string;
  subtext?: string;
  appearance?: "base" | "dashboard";
};

export function KpiCard({ label, value, subtext, appearance = "base" }: KpiCardProps) {
  const isDashboard = appearance === "dashboard";

  return (
    <article
      className={
        isDashboard
          ? "rounded-2xl border border-brand-border/70 bg-gradient-to-br from-brand-panel to-brand-panel-muted/85 p-6 shadow-brand-card"
          : "rounded-2xl border border-brand-border bg-brand-panel p-6 shadow-brand-card"
      }
    >
      <p className={isDashboard ? "text-xs uppercase tracking-[0.11em] text-brand-text-secondary" : "text-sm text-brand-text-secondary"}>{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-brand-text-primary">{value}</p>
      {subtext ? <p className={isDashboard ? "mt-2 text-sm leading-relaxed text-brand-text-muted" : "mt-2 text-sm text-brand-text-muted"}>{subtext}</p> : null}
    </article>
  );
}
