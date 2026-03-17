import { Badge } from "./Badge";
import { DashboardSectionHeader } from "./DashboardSectionHeader";
import { PanelCard } from "@/src/components/ui/panel-card";
import { getInsightCardPresentation } from "@/src/lib/dashboard/insight-presentation";
import type { DashboardInsightCard } from "@/src/lib/dashboard/insights";
import type { DashboardDiagnosisViewModel } from "@/src/lib/dashboard/diagnosis";

type InsightCardsSectionProps = {
  insights: DashboardInsightCard[];
  diagnosis?: DashboardDiagnosisViewModel | null;
  loading?: boolean;
};

type InsightArticleProps = {
  insight: DashboardInsightCard;
  featured?: boolean;
};

function InsightArticle({ insight, featured = false }: InsightArticleProps) {
  const presentation = getInsightCardPresentation(insight.variant);
  return (
    <article
      className={`relative overflow-hidden rounded-[1.2rem] border shadow-brand-card ${presentation.cardClassName} ${featured ? "p-6" : "p-5"}`}
      data-testid={`dashboard-insight-card-${insight.variant}`}
    >
      <div className={`absolute inset-x-0 top-0 h-0.5 ${presentation.accentClassName}`} />
      <div className="relative flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Pattern</p>
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
      <h3 className={`mt-3 font-semibold leading-snug text-brand-text-primary break-words ${featured ? "text-xl" : "text-lg"}`}>
        {insight.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary break-words">{insight.body}</p>
      {insight.stateDetail ? <p className="mt-3 text-xs leading-relaxed text-brand-text-muted break-words">{insight.stateDetail}</p> : null}
      <div className={`mt-4 rounded-xl border p-3.5 ${presentation.implicationPanelClassName}`}>
        <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Why it matters</p>
        <p className="mt-1.5 text-sm leading-relaxed text-brand-text-primary break-words">{insight.implication}</p>
      </div>
    </article>
  );
}

function DiagnosisConstraintCard({ diagnosis, loading }: { diagnosis: DashboardDiagnosisViewModel; loading?: boolean }) {
  return (
    <article
      className="relative overflow-hidden rounded-[1.2rem] border border-brand-border-strong/70 bg-[linear-gradient(155deg,rgba(20,43,86,0.9),rgba(14,30,60,0.92))] p-5 shadow-brand-card"
      data-testid="dashboard-insight-biggest-constraint"
    >
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-400/60 via-amber-300/40 to-transparent" />
      <div className="relative flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Biggest constraint</p>
        {diagnosis.hasTypedDiagnosis ? (
          <span className="rounded-full border border-brand-border/75 bg-brand-panel/75 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-brand-text-muted">
            From report
          </span>
        ) : null}
      </div>
      {loading && !diagnosis.hasTypedDiagnosis ? (
        <div className="mt-3 space-y-2">
          <div className="h-2.5 w-full animate-pulse rounded-full bg-brand-border/70" />
          <div className="h-2.5 w-4/5 animate-pulse rounded-full bg-brand-border/55" />
        </div>
      ) : (
        <>
          <h3 className="mt-3 text-lg font-semibold leading-snug text-brand-text-primary break-words">{diagnosis.heading}</h3>
          <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary break-words">
            {diagnosis.summary ?? diagnosis.unavailableBody ?? "Diagnosis details are limited for this dashboard snapshot."}
          </p>
        </>
      )}
    </article>
  );
}

export function InsightCardsSection({ insights, diagnosis, loading }: InsightCardsSectionProps) {
  const secondaryInsights = insights.slice(1);
  const hasConstraint = diagnosis != null;

  return (
    <section className="space-y-3" data-testid="dashboard-section-what-we-see">
      <DashboardSectionHeader title="Signals worth watching" description="High-signal patterns surfaced in the latest completed report." />
      <PanelCard className="border-brand-border/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(19,41,80,0.9),rgba(16,32,67,0.95))]">
        {insights.length === 0 && !hasConstraint ? (
          <div
            className="rounded-2xl border border-dashed border-brand-border-strong/70 bg-brand-panel-muted/75 p-5"
            data-testid="dashboard-insights-empty"
          >
            <p className="text-sm text-brand-text-secondary">
              New insight cards appear after a completed report with enough evidence to summarize the pattern clearly.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.length > 0 ? <InsightArticle insight={insights[0]} featured /> : null}
            {hasConstraint || secondaryInsights.length > 0 ? (
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {hasConstraint ? (
                  <li>
                    <DiagnosisConstraintCard diagnosis={diagnosis} loading={loading} />
                  </li>
                ) : null}
                {secondaryInsights.map((insight) => (
                  <li key={insight.id}>
                    <InsightArticle insight={insight} />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </PanelCard>
    </section>
  );
}
