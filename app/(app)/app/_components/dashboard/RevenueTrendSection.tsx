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

function movementToneClass(label: string | null): string {
  if (!label) {
    return "border-brand-border/70 bg-brand-panel/65 text-brand-text-secondary";
  }

  const normalized = label.toLowerCase();
  if (normalized.startsWith("up")) {
    return "border-emerald-300/45 bg-emerald-500/15 text-emerald-100";
  }

  if (normalized.startsWith("down")) {
    return "border-amber-300/45 bg-amber-500/16 text-amber-100";
  }

  return "border-brand-border-strong/75 bg-brand-panel/70 text-brand-text-secondary";
}

export function RevenueTrendSection({ trend, trendPreview, loading, ctaLabel, ctaHref }: RevenueTrendSectionProps) {
  const movementClassName = movementToneClass(trend.movementLabel);

  return (
    <section className="space-y-3" data-testid="dashboard-section-revenue-trend">
      <DashboardSectionHeader title="Revenue Trend" description="Recent net revenue movement from your latest completed report." />
      <PanelCard className="border-brand-border/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(19,41,80,0.9),rgba(16,32,67,0.95))]">
        {loading ? (
          <div className="space-y-3" data-testid="dashboard-revenue-trend-loading">
            <SkeletonBlock className="h-4 w-52 bg-brand-border/60" />
            <SkeletonBlock className="h-48 w-full rounded-2xl bg-brand-panel-muted/85" />
            <SkeletonBlock className="h-3 w-72 bg-brand-border/50" />
          </div>
        ) : trend.hasRenderableChart ? (
          <div className="space-y-5" data-testid="dashboard-revenue-trend-ready">
            <div className="rounded-2xl border border-brand-border-strong/70 bg-brand-panel/70 px-4 py-4 shadow-brand-card">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Latest revenue</p>
                  <p className="mt-1.5 text-3xl font-semibold tracking-tight text-brand-text-primary md:text-4xl">{trend.latestValueDisplay ?? "$--"}</p>
                </div>
                <div className="space-y-1 text-right">
                  {trend.movementLabel ? (
                    <p className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.08em] ${movementClassName}`}>
                      {trend.movementLabel}
                    </p>
                  ) : null}
                  {trend.periodLabel ? <p className="text-xs text-brand-text-muted">{trend.periodLabel}</p> : null}
                </div>
              </div>
            </div>
            <RevenueTrendChart points={trend.points} />
            {trendPreview ? (
              <p className="rounded-xl border border-brand-border/70 bg-brand-panel/72 px-4 py-3 text-sm leading-relaxed text-brand-text-secondary">
                {trendPreview}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4" data-testid="dashboard-revenue-trend-empty">
            {trendPreview ? (
              <div className="rounded-2xl border border-brand-border-strong/70 bg-brand-panel/76 p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Latest narrative signal</p>
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
