import { Badge } from "./Badge";
import { DashboardSectionHeader } from "./DashboardSectionHeader";
import { TruthNotice } from "./TruthNotice";
import { PanelCard } from "@/src/components/ui/panel-card";
import type { DashboardDiagnosisViewModel } from "@/src/lib/dashboard/diagnosis";

type DiagnosisSectionProps = {
  diagnosis: DashboardDiagnosisViewModel;
  loading?: boolean;
};

export function DiagnosisSection({ diagnosis, loading = false }: DiagnosisSectionProps) {
  return (
    <section className="space-y-3" data-testid="dashboard-diagnosis-section">
      <DashboardSectionHeader
        title="Diagnosis"
        description="Current primary constraint from typed report evidence, bounded by the available report data."
      />
      <PanelCard className="border-brand-border/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(19,41,80,0.9),rgba(16,32,67,0.95))]">
        {loading && !diagnosis.hasTypedDiagnosis ? (
          <div
            className="rounded-2xl border border-brand-border/75 bg-[linear-gradient(155deg,rgba(19,41,80,0.74),rgba(16,32,67,0.86))] p-4"
            data-testid="dashboard-diagnosis-loading"
          >
            <p className="text-sm text-brand-text-secondary">Loading typed diagnosis from your latest report...</p>
            <div className="mt-3 space-y-2">
              <div className="h-2.5 w-full animate-pulse rounded-full bg-brand-border/70" />
              <div className="h-2.5 w-4/5 animate-pulse rounded-full bg-brand-border/55" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {diagnosis.notice ? <TruthNotice notice={diagnosis.notice} testId="dashboard-diagnosis-notice" /> : null}

            <div className={diagnosis.comparisonContext ? "grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]" : ""}>
              <article className="rounded-[1.2rem] border border-brand-border-strong/70 bg-[linear-gradient(155deg,rgba(19,41,80,0.82),rgba(16,32,67,0.9))] p-5 shadow-brand-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Latest report diagnosis</p>
                    <h3 className="mt-2 text-xl font-semibold leading-snug text-brand-text-primary">{diagnosis.heading}</h3>
                  </div>
                  {diagnosis.hasTypedDiagnosis ? (
                    <span className="rounded-full border border-brand-border/75 bg-brand-panel/75 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-brand-text-muted">
                      Based on available report data
                    </span>
                  ) : null}
                </div>

                {diagnosis.summary ? (
                  <p className="mt-3 text-sm leading-relaxed text-brand-text-secondary" data-testid="dashboard-diagnosis-summary">
                    {diagnosis.summary}
                  </p>
                ) : (
                  <p className="mt-3 text-sm leading-relaxed text-brand-text-secondary" data-testid="dashboard-diagnosis-unavailable">
                    {diagnosis.unavailableBody ?? "Diagnosis details are limited for this dashboard snapshot."}
                  </p>
                )}
              </article>

              {diagnosis.comparisonContext ? (
                <article
                  className="rounded-[1.2rem] border border-brand-border-strong/70 bg-[linear-gradient(155deg,rgba(17,38,73,0.88),rgba(16,32,67,0.92))] p-5 shadow-brand-card"
                  data-testid="dashboard-diagnosis-context"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">{diagnosis.comparisonContext.label}</p>
                    {diagnosis.comparisonContext.stateLabel ? (
                      <Badge variant={diagnosis.comparisonContext.stateTone ?? "neutral"}>{diagnosis.comparisonContext.stateLabel}</Badge>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-brand-text-primary">{diagnosis.comparisonContext.body}</p>
                  {diagnosis.comparisonContext.detail ? (
                    <p className="mt-3 text-xs leading-relaxed text-brand-text-muted">{diagnosis.comparisonContext.detail}</p>
                  ) : null}
                </article>
              ) : null}
            </div>

            {diagnosis.supportingMetrics.length > 0 ? (
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-3" data-testid="dashboard-diagnosis-supporting-metrics">
                {diagnosis.supportingMetrics.map((metric) => (
                  <li
                    key={metric.id}
                    className="rounded-[1.1rem] border border-brand-border/75 bg-[linear-gradient(155deg,rgba(19,41,80,0.76),rgba(16,32,67,0.88))] p-4 shadow-brand-card"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">{metric.label}</p>
                      {metric.stateLabel ? <Badge variant={metric.stateTone ?? "neutral"}>{metric.stateLabel}</Badge> : null}
                    </div>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-brand-text-primary">{metric.value}</p>
                    {metric.detail ? <p className="mt-2 text-xs leading-relaxed text-brand-text-muted">{metric.detail}</p> : null}
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
