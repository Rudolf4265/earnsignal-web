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

  return card.metrics.map((metric) => `${metric.label}: ${metric.value}`).join(" · ");
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
        <p className="max-w-3xl text-sm leading-7 text-slate-600" data-testid="report-audience-growth-summary">
          {intro}
        </p>
      ) : null}

      {rows.length > 0 ? (
        <div className="divide-y divide-slate-200/80 border-y border-slate-200/80" data-testid="report-audience-growth-rows">
          {rows.map((card) => (
            <article
              key={card.id}
              className="grid gap-2 py-4 md:grid-cols-[minmax(140px,180px)_minmax(0,1fr)] md:gap-6"
              data-testid={`report-audience-growth-row-${card.id}`}
            >
              <p className="text-sm font-semibold text-slate-900">{card.label}</p>
              <p className="text-sm leading-7 text-slate-600">{summarizeCard(card)}</p>
            </article>
          ))}
        </div>
      ) : null}

      {model.includedSources.length > 0 ? (
        <div className="space-y-2" data-testid="report-audience-growth-sources">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Included sources</p>
          <div className="flex flex-wrap gap-2.5">
            {model.includedSources.map((source) => (
              <div
                key={source.id}
                className="cursor-default select-none rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs text-slate-600"
                data-testid={`report-audience-growth-source-${source.id}`}
              >
                <span className="font-semibold text-slate-900">{source.label}</span>
                {source.latestPeriodLabel || source.dataType ? (
                  <span className="ml-2 text-slate-500">{[source.latestPeriodLabel, source.dataType].filter(Boolean).join(" · ")}</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {model.trustNote ? (
        <p className="text-xs leading-6 text-slate-500" data-testid="report-audience-growth-trust-note">
          {model.trustNote}
        </p>
      ) : null}
    </div>
  );
}
