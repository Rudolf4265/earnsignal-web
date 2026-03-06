type KpiCardProps = {
  label: string;
  value: string;
  subtext?: string;
};

export function KpiCard({ label, value, subtext }: KpiCardProps) {
  return (
    <article className="rounded-2xl border border-brand-border bg-brand-panel p-6 shadow-brand-card">
      <p className="text-sm text-brand-text-secondary">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-brand-text-primary">{value}</p>
      {subtext ? <p className="mt-2 text-sm text-brand-text-muted">{subtext}</p> : null}
    </article>
  );
}
