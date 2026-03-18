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
      className={`relative overflow-hidden rounded-[1.2rem] border shadow-brand-card ${presentation.cardClassName} ${featured ? "p-5" : "p-4"}`}
      data-testid={`dashboard-insight-card-${insight.variant}`}
    >
      <div className={`absolute inset-x-0 top-0 h-0.5 ${presentation.accentClassName}`} />
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={presentation.badgeVariant}
            className={`px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${presentation.badgeClassName}`}
          >
            {presentation.badgeLabel}
          </Badge>
          {insight.stateLabel ? (
            <Badge variant={insight.stateTone ?? "neutral"} className="px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]">
              {insight.stateLabel}
            </Badge>
          ) : null}
        </div>
      </div>
      <h3 className={`mt-3 font-semibold leading-snug text-brand-text-primary break-words ${featured ? "text-xl" : "text-base"}`}>
        {insight.title}
      </h3>
      <p className={`mt-1.5 leading-relaxed text-brand-text-secondary break-words ${featured ? "text-sm" : "text-sm"}`}>{insight.body}</p>
      {insight.stateDetail ? <p className="mt-2 text-xs leading-relaxed text-brand-text-muted break-words">{insight.stateDetail}</p> : null}
      <p className="mt-3 text-xs leading-relaxed text-brand-text-muted break-words">
        <span className="font-medium text-brand-text-secondary/70">Why it matters — </span>
        {insight.implication}
      </p>
    </article>
  );
}

function DiagnosisConstraintCard({ diagnosis, loading }: { diagnosis: DashboardDiagnosisViewModel; loading?: boolean }) {
  return (
    <article
      className="relative overflow-hidden rounded-[1.2rem] border border-brand-border-strong/65 bg-[linear-gradient(155deg,rgba(20,43,86,0.88),rgba(14,30,60,0.90))] p-4 shadow-brand-card"
      data-testid="dashboard-insight-biggest-constraint"
    >
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-300/38 via-amber-200/18 to-transparent" />
      <div className="relative flex items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.14em] text-brand-text-muted">Biggest constraint</p>
        {diagnosis.hasTypedDiagnosis ? (
          <span className="rounded-full border border-brand-border/60 bg-brand-panel/60 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-brand-text-muted">
            From report
          </span>
        ) : null}
      </div>
      {loading && !diagnosis.hasTypedDiagnosis ? (
        <div className="mt-3 space-y-2">
          <div className="h-2 w-full animate-pulse rounded-full bg-brand-border/70" />
          <div className="h-2 w-4/5 animate-pulse rounded-full bg-brand-border/55" />
        </div>
      ) : (
        <>
          <h3 className="mt-2.5 text-base font-semibold leading-snug text-brand-text-primary break-words">{diagnosis.heading}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-brand-text-secondary break-words">
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
              <ul className="grid grid-cols-1 gap-3">
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
