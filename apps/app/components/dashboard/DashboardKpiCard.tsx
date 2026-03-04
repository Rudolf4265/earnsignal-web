import { mutedLabelClassName, panelClassName } from "./dashboardStyles";

type DashboardKpiCardProps = {
  title: string;
  subtitle: string;
  value: string;
};

export function DashboardKpiCard({ title, subtitle, value }: DashboardKpiCardProps) {
  return (
    <article className={`${panelClassName} relative overflow-hidden`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-blue-500/20 to-transparent"
      />
      <p className="text-xl font-semibold text-white/90">{title}</p>
      <p className={`${mutedLabelClassName} mt-1`}>{subtitle}</p>
      <p className="mt-5 text-4xl font-semibold tracking-tight text-white">{value}</p>
    </article>
  );
}
