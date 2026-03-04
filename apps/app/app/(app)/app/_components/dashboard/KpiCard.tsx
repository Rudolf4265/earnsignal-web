type KpiCardProps = {
  label: string;
  value: string;
  subtext?: string;
};

export function KpiCard({ label, value, subtext }: KpiCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      {subtext ? <p className="mt-2 text-sm text-slate-600">{subtext}</p> : null}
    </article>
  );
}
