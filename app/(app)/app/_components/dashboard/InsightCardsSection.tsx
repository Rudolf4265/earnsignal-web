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
      <PanelCard className="border-brand-border/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(19,41,80,0.9),rgba(16,32,67,0.95))]">
        {insights.length === 0 ? (
          <div
            className="rounded-2xl border border-dashed border-brand-border-strong/70 bg-brand-panel-muted/75 p-5"
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
                    className={`relative h-full overflow-hidden rounded-[1.2rem] border p-5 shadow-brand-card ${presentation.cardClassName}`}
                    data-testid={`dashboard-insight-card-${insight.variant}`}
                  >
                    <div className={`absolute inset-x-0 top-0 h-0.5 ${presentation.accentClassName}`} />
                    <div className="relative flex items-center justify-between gap-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Signal</p>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {insight.stateLabel ? (
                          <Badge variant={insight.stateTone ?? "neutral"} className="px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]">
                            {insight.stateLabel}
                          </Badge>
                        ) : null}
                        <Badge
                          variant={presentation.badgeVariant}
                          className={`px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${presentation.badgeClassName}`}
                        >
                          {presentation.badgeLabel}
                        </Badge>
                      </div>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold leading-snug text-brand-text-primary break-words">{insight.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary break-words">{insight.body}</p>
                    {insight.stateDetail ? <p className="mt-3 text-xs leading-relaxed text-brand-text-muted break-words">{insight.stateDetail}</p> : null}
                    <div className={`mt-4 rounded-xl border p-3.5 ${presentation.implicationPanelClassName}`}>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Why it matters</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-brand-text-primary break-words">{insight.implication}</p>
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
