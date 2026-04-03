"use client";

import { PanelCard } from "@/src/components/ui/panel-card";
import type { ReportDetailAudienceGrowthPresentation } from "@/src/lib/report/detail-presentation";

type ReportAudienceGrowthSectionProps = {
  model: ReportDetailAudienceGrowthPresentation;
};

export function ReportAudienceGrowthSection({ model }: ReportAudienceGrowthSectionProps) {
  return (
    <PanelCard
      className="space-y-4 border-brand-border/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(19,41,80,0.9),rgba(16,32,67,0.95))]"
      data-testid="report-audience-growth-section"
    >
      <div>
        <p className="text-[11px] uppercase tracking-[0.14em] text-brand-accent-teal/80">{model.title}</p>
        {model.subtitle ? <p className="mt-1.5 text-sm leading-relaxed text-brand-text-secondary">{model.subtitle}</p> : null}
      </div>

      {model.summaryTiles.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="report-audience-growth-summary">
          {model.summaryTiles.map((tile) => (
            <article
              key={tile.id}
              className="rounded-[1rem] border border-brand-border-strong/70 bg-[linear-gradient(155deg,rgba(19,41,80,0.82),rgba(16,32,67,0.92))] p-3.5"
            >
              <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">{tile.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-brand-text-primary">{tile.value}</p>
            </article>
          ))}
        </div>
      ) : null}

      {model.includedSources.length > 0 ? (
        <div className="space-y-2" data-testid="report-audience-growth-sources">
          <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-muted">Included sources</p>
          <div className="flex flex-wrap gap-2.5">
          {model.includedSources.map((source) => (
            <div
              key={source.id}
              className="cursor-default select-none rounded-2xl border border-brand-border/70 bg-brand-panel/55 px-3 py-2 text-xs text-brand-text-secondary shadow-none"
              data-testid={`report-audience-growth-source-${source.id}`}
            >
              <p className="font-semibold text-brand-text-primary">{source.label}</p>
              {source.latestPeriodLabel || source.dataType ? (
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-brand-text-muted">
                  {[source.latestPeriodLabel, source.dataType].filter(Boolean).join(" | ")}
                </p>
              ) : null}
            </div>
          ))}
          </div>
        </div>
      ) : null}

      {model.platformCards.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-3" data-testid="report-audience-growth-cards">
          {model.platformCards.map((card) => (
            <article
              key={card.id}
              className="rounded-[1.05rem] border border-brand-border-strong/70 bg-[linear-gradient(155deg,rgba(19,41,80,0.8),rgba(16,32,67,0.9))] p-4"
            >
              <p className="text-sm font-semibold text-brand-text-primary">{card.label}</p>
              {card.metrics.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {card.metrics.map((metric) => (
                    <div key={metric.id} className="flex items-baseline justify-between gap-3">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-brand-text-muted">{metric.label}</p>
                      <p className="text-sm font-semibold text-brand-text-primary">{metric.value}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              {card.insight ? <p className="mt-3 text-sm leading-relaxed text-brand-text-secondary">{card.insight}</p> : null}
            </article>
          ))}
        </div>
      ) : null}

      {model.diagnosis ? (
        <article
          className="rounded-[1.05rem] border border-brand-border-strong/70 bg-brand-panel/72 p-4"
          data-testid="report-audience-growth-diagnosis"
        >
          <p className="text-sm font-semibold text-brand-text-primary">What your audience data suggests</p>
          <div className="mt-3 space-y-2">
            {model.diagnosis.strongestSignal ? (
              <p className="text-sm leading-relaxed text-brand-text-secondary">
                <span className="font-medium text-brand-text-primary">Strongest signal:</span> {model.diagnosis.strongestSignal}
              </p>
            ) : null}
            {model.diagnosis.watchout ? (
              <p className="text-sm leading-relaxed text-brand-text-secondary">
                <span className="font-medium text-brand-text-primary">Watchout:</span> {model.diagnosis.watchout}
              </p>
            ) : null}
            {model.diagnosis.nextBestMove ? (
              <p className="text-sm leading-relaxed text-brand-text-secondary">
                <span className="font-medium text-brand-text-primary">Next best move:</span> {model.diagnosis.nextBestMove}
              </p>
            ) : null}
          </div>
        </article>
      ) : null}

      {model.trustNote ? (
        <div className="rounded-xl border border-brand-border/60 bg-brand-panel/50 px-4 py-3" data-testid="report-audience-growth-trust-note">
          <p className="text-xs leading-relaxed text-brand-text-muted">{model.trustNote}</p>
        </div>
      ) : null}
    </PanelCard>
  );
}
