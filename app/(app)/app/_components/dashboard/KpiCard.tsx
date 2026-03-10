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
          ? "rounded-[1.2rem] border border-brand-border-strong/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.95),rgba(19,41,80,0.92),rgba(16,32,67,0.96))] p-6 shadow-brand-card"
          : "rounded-2xl border border-brand-border bg-brand-panel p-6 shadow-brand-card"
      }
    >
      <p className={isDashboard ? "text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary" : "text-sm text-brand-text-secondary"}>{label}</p>
      <p className={isDashboard ? "mt-2 text-4xl font-semibold tracking-tight text-brand-text-primary" : "mt-2 text-3xl font-semibold tracking-tight text-brand-text-primary"}>
        {value}
      </p>
      {subtext ? (
        <p className={isDashboard ? "mt-3 text-sm leading-relaxed text-brand-text-muted" : "mt-2 text-sm text-brand-text-muted"}>{subtext}</p>
      ) : null}
    </article>
  );
}
