import { Badge } from "./Badge";
import { DashboardSectionHeader } from "./DashboardSectionHeader";
import { PanelCard } from "@/src/components/ui/panel-card";
import { getInsightCardPresentation } from "@/src/lib/dashboard/insight-presentation";
import type { DashboardInsightCard } from "@/src/lib/dashboard/insights";

type InsightCardsSectionProps = {
  insights: DashboardInsightCard[];
};

export function InsightCardsSection({ insights }: InsightCardsSectionProps) {
  return (
    <section className="space-y-3" data-testid="dashboard-section-what-we-see">
      <DashboardSectionHeader title="What We See" description="Narrative insights from your latest completed analysis." />
      <PanelCard className="border-brand-border/70 bg-gradient-to-br from-brand-panel to-brand-panel-muted/90">
        {insights.length === 0 ? (
          <div
            className="rounded-2xl border border-dashed border-brand-border-strong/70 bg-brand-panel-muted/70 p-5"
            data-testid="dashboard-insights-empty"
          >
            <p className="text-sm text-brand-text-secondary">
              Not enough signal data is available yet. Narrative insight cards will appear here after your next completed report.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {insights.map((insight) => {
              const presentation = getInsightCardPresentation(insight.variant);
              return (
                <li key={insight.id}>
                  <article
                    className={`h-full rounded-2xl border border-brand-border/70 p-4 ${presentation.cardClassName}`}
                    data-testid={`dashboard-insight-card-${insight.variant}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-brand-text-secondary">Signal</p>
                      <Badge variant={presentation.badgeVariant}>{presentation.badgeLabel}</Badge>
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-brand-text-primary break-words">{insight.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary break-words">{insight.body}</p>
                    <div className={`mt-4 rounded-xl border p-3 ${presentation.implicationPanelClassName}`}>
                      <p className="text-xs uppercase tracking-[0.12em] text-brand-text-secondary">Why it matters</p>
                      <p className="mt-1 text-sm leading-relaxed text-brand-text-primary break-words">{insight.implication}</p>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </PanelCard>
    </section>
  );
}
