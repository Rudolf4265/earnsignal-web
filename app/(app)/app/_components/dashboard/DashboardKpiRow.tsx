import type { DashboardKpiItem } from "@/src/lib/dashboard/kpi-row";
import { SkeletonBlock } from "../../../_components/ui/skeleton";

type DashboardKpiRowProps = {
  items: DashboardKpiItem[];
  loading?: boolean;
};

function KpiCard({ item }: { item: DashboardKpiItem }) {
  return (
    <article
      className="flex h-[108px] flex-col justify-between rounded-[1.15rem] border border-brand-border/70 bg-[linear-gradient(155deg,rgba(16,32,67,0.92),rgba(19,41,80,0.78),rgba(16,32,67,0.92))] p-4 shadow-brand-card"
      data-testid={`dashboard-kpi-${item.id}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text-secondary">{item.label}</p>
      <p className="text-3xl font-semibold tracking-tight text-brand-text-primary">{item.value}</p>
      <p className="min-h-[1.25rem] text-xs text-brand-text-muted">{item.changeLabel ?? "Latest report baseline"}</p>
    </article>
  );
}

export function DashboardKpiRow({ items, loading = false }: DashboardKpiRowProps) {
  if (!loading && items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3" data-testid="dashboard-kpi-row">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">Key metrics</p>

      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }, (_, index) => (
              <div
                key={`dashboard-kpi-skeleton-${index + 1}`}
                className="flex h-[108px] flex-col justify-between rounded-[1.15rem] border border-brand-border/70 bg-brand-panel/70 p-4"
              >
                <SkeletonBlock className="h-3 w-20 bg-brand-border/55" />
                <SkeletonBlock className="h-8 w-28 bg-brand-border/45" />
                <SkeletonBlock className="h-3 w-36 bg-brand-border/35" />
              </div>
            ))
          : items.map((item) => <KpiCard key={item.id} item={item} />)}
      </div>
    </section>
  );
}
