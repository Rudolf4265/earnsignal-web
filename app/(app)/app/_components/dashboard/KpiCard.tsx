type KpiCardProps = {
  label: string;
  value: string;
  subtext?: string;
};

export function KpiCard({ label, value, subtext }: KpiCardProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-navy-900 p-6">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      {subtext ? <p className="mt-2 text-sm text-gray-400">{subtext}</p> : null}
    </article>
  );
}
