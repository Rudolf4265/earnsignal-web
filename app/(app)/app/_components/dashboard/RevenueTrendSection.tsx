import { DashboardSectionHeader } from "./DashboardSectionHeader";
import { RevenueTrendChart } from "./RevenueTrendChart";
import { EmptyState } from "./EmptyState";
import { SkeletonBlock } from "../../../_components/ui/skeleton";
import { PanelCard } from "@/src/components/ui/panel-card";
import type { DashboardRevenueTrendViewModel } from "@/src/lib/dashboard/revenue-trend";

type RevenueTrendSectionProps = {
  trend: DashboardRevenueTrendViewModel;
  trendPreview: string | null;
  loading: boolean;
  ctaLabel: string;
  ctaHref: string;
};

export function RevenueTrendSection({ trend, trendPreview, loading, ctaLabel, ctaHref }: RevenueTrendSectionProps) {
  return (
    <section className="space-y-3" data-testid="dashboard-section-revenue-trend">
      <DashboardSectionHeader title="Revenue Trend" description="Recent net revenue movement from your latest completed report." />
      <PanelCard className="border-brand-border/70 bg-gradient-to-br from-brand-panel to-brand-panel-muted/90">
        {loading ? (
          <div className="space-y-3" data-testid="dashboard-revenue-trend-loading">
            <SkeletonBlock className="h-4 w-52 bg-brand-border/60" />
            <SkeletonBlock className="h-48 w-full rounded-2xl bg-brand-panel-muted/85" />
            <SkeletonBlock className="h-3 w-72 bg-brand-border/50" />
          </div>
        ) : trend.hasRenderableChart ? (
          <div className="space-y-4" data-testid="dashboard-revenue-trend-ready">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-brand-text-secondary">Latest revenue</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-brand-text-primary">{trend.latestValueDisplay ?? "$--"}</p>
              </div>
              <div className="space-y-1 text-right">
                {trend.movementLabel ? <p className="text-sm text-brand-accent-emerald">{trend.movementLabel}</p> : null}
                {trend.periodLabel ? <p className="text-xs text-brand-text-muted">{trend.periodLabel}</p> : null}
              </div>
            </div>
            <RevenueTrendChart points={trend.points} />
            {trendPreview ? (
              <p className="rounded-xl border border-brand-border/60 bg-brand-panel/70 px-4 py-3 text-sm leading-relaxed text-brand-text-secondary">
                {trendPreview}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4" data-testid="dashboard-revenue-trend-empty">
            {trendPreview ? (
              <div className="rounded-2xl border border-brand-border/70 bg-brand-panel/75 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-brand-text-secondary">Latest narrative signal</p>
                <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">{trendPreview}</p>
              </div>
            ) : null}
            <EmptyState
              title="Charts appear once data is connected"
              body="Upload revenue data to populate a readable month-over-month trend line."
              ctaLabel={ctaLabel}
              ctaHref={ctaHref}
              appearance="dashboard"
            />
          </div>
        )}
      </PanelCard>
    </section>
  );
}
