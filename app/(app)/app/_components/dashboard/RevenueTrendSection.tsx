import { DashboardSectionHeader } from "./DashboardSectionHeader";
import { EmptyState } from "./EmptyState";
import { PanelCard } from "@/src/components/ui/panel-card";

type RevenueTrendSectionProps = {
  trendPreview: string | null;
  ctaLabel: string;
  ctaHref: string;
};

export function RevenueTrendSection({ trendPreview, ctaLabel, ctaHref }: RevenueTrendSectionProps) {
  return (
    <section className="space-y-4" data-testid="dashboard-section-revenue-trend">
      <DashboardSectionHeader title="Revenue Trend" description="High-level movement summary until full charting is enabled." />
      <PanelCard>
        {trendPreview ? (
          <p className="rounded-xl border border-brand-border bg-brand-panel-muted/60 p-4 text-sm text-brand-text-secondary">{trendPreview}</p>
        ) : (
          <EmptyState
            title="Charts appear once data is connected"
            body="Upload revenue data to populate trend lines, variance windows, and seasonality insights."
            ctaLabel={ctaLabel}
            ctaHref={ctaHref}
          />
        )}
      </PanelCard>
    </section>
  );
}
