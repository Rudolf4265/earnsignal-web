"use client";

import type { ReportDetailAudienceGrowthPresentation } from "@/src/lib/report/detail-presentation";

type ReportAudienceGrowthSectionProps = {
  model: ReportDetailAudienceGrowthPresentation;
};

function summarizeCard(card: ReportDetailAudienceGrowthPresentation["platformCards"][number]): string {
  if (card.insight) {
    return card.insight;
  }

  if (card.metrics.length === 0) {
    return "Signal detail is limited in this report.";
  }

  return card.metrics.map((metric) => `${metric.label}: ${metric.value}`).join(" | ");
}

export function ReportAudienceGrowthSection({ model }: ReportAudienceGrowthSectionProps) {
  const rows = model.platformCards.slice(0, 3);
  const intro =
    model.diagnosis?.strongestSignal ??
    model.subtitle ??
    (rows.length > 0 ? "Audience data is supporting the revenue read, but it stays secondary to the business numbers." : null);

  if (!intro && rows.length === 0 && model.includedSources.length === 0 && !model.trustNote) {
    return null;
  }

  return (
    <div className="space-y-5" data-testid="report-audience-growth-section">
      {intro ? (
        <p className="max-w-3xl text-sm leading-7 text-brand-text-secondary" data-testid="report-audience-growth-summary">
          {intro}
        </p>
      ) : null}

      {rows.length > 0 ? (
        <div className="divide-y divide-brand-border/60 border-y border-brand-border/65" data-testid="report-audience-growth-rows">
          {rows.map((card) => (
            <article
              key={card.id}
              className="grid gap-2 py-4 md:grid-cols-[minmax(140px,180px)_minmax(0,1fr)] md:gap-6"
              data-testid={`report-audience-growth-row-${card.id}`}
            >
              <p className="text-sm font-semibold text-brand-text-primary">{card.label}</p>
              <p className="text-sm leading-7 text-brand-text-secondary">{summarizeCard(card)}</p>
            </article>
          ))}
        </div>
      ) : null}

      {model.includedSources.length > 0 ? (
        <div className="space-y-2" data-testid="report-audience-growth-sources">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">Included sources</p>
          <div className="flex flex-wrap gap-2.5">
            {model.includedSources.map((source) => (
              <div
                key={source.id}
                className="cursor-default select-none rounded-full border border-brand-border/70 bg-brand-panel/65 px-3 py-1.5 text-xs text-brand-text-secondary"
                data-testid={`report-audience-growth-source-${source.id}`}
              >
                <span className="font-semibold text-brand-text-primary">{source.label}</span>
                {source.latestPeriodLabel || source.dataType ? (
                  <span className="ml-2 text-brand-text-muted">{[source.latestPeriodLabel, source.dataType].filter(Boolean).join(" | ")}</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {model.trustNote ? (
        <p className="text-xs leading-6 text-brand-text-muted" data-testid="report-audience-growth-trust-note">
          {model.trustNote}
        </p>
      ) : null}
    </div>
  );
}
