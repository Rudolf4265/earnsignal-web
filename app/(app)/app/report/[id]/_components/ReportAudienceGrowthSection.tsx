"use client";

import type { ReportDetailAudienceGrowthPresentation } from "@/src/lib/report/detail-presentation";

type ReportAudienceGrowthSectionProps = {
  model: ReportDetailAudienceGrowthPresentation;
  emptyMessage?: string | null;
};

const TILE_ACCENT: Record<string, string> = {
  creator_score: "var(--es-color-accent-teal)",
  source_coverage: "var(--es-color-accent-blue)",
  audience_momentum: "var(--es-color-accent-emerald)",
  engagement_signal: "var(--es-color-accent-teal)",
};

function SummaryTile({ id, label, value }: { id: string; label: string; value: string }) {
  const accent = TILE_ACCENT[id] ?? "var(--es-color-accent-teal)";
  return (
    <div
      className="rounded-xl border border-brand-border/60 bg-brand-panel-muted/40 px-4 py-3"
      style={{ borderLeftColor: accent, borderLeftWidth: 3 }}
      data-testid={`report-audience-growth-tile-${id}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-white">{value}</p>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-brand-border/50 bg-brand-panel/40 px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-brand-text-muted">{label}</p>
      <p className="mt-0.5 text-base font-semibold tracking-tight text-white">{value}</p>
    </div>
  );
}

function PlatformCard({ card }: { card: ReportDetailAudienceGrowthPresentation["platformCards"][number] }) {
  return (
    <article
      className="rounded-2xl border border-brand-border/65 bg-[linear-gradient(165deg,rgba(17,34,69,0.85),rgba(11,24,50,0.80))] p-5"
      data-testid={`report-audience-growth-card-${card.id}`}
    >
      {/* Platform label */}
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em]"
        style={{ color: "var(--es-color-accent-teal)" }}>
        {card.label}
      </p>

      {/* Metric pills grid */}
      {card.metrics.length > 0 ? (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {card.metrics.map((m) => (
            <MetricPill key={m.id} label={m.label} value={m.value} />
          ))}
        </div>
      ) : null}

      {/* Platform insight */}
      {card.insight ? (
        <p className="text-sm leading-relaxed text-brand-text-secondary">{card.insight}</p>
      ) : card.metrics.length === 0 ? (
        <p className="text-sm text-brand-text-muted">Signal detail is limited for this platform.</p>
      ) : null}
    </article>
  );
}

export function ReportAudienceGrowthSection({ model, emptyMessage = null }: ReportAudienceGrowthSectionProps) {
  const cards = model.platformCards.slice(0, 3);
  const diagnosisSummary = model.diagnosis?.strongestSignal ?? model.subtitle ?? null;
  const watchout = model.diagnosis?.watchout ?? null;
  const nextBestMove = model.diagnosis?.nextBestMove ?? null;

  if (
    !diagnosisSummary &&
    cards.length === 0 &&
    model.summaryTiles.length === 0 &&
    model.includedSources.length === 0 &&
    !model.trustNote &&
    !emptyMessage
  ) {
    return null;
  }

  return (
    <div className="space-y-6" data-testid="report-audience-growth-section">
      {/* Summary tiles */}
      {model.summaryTiles.length > 0 ? (
        <div
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          data-testid="report-audience-growth-tiles"
        >
          {model.summaryTiles.map((tile) => (
            <SummaryTile key={tile.id} id={tile.id} label={tile.label} value={tile.value} />
          ))}
        </div>
      ) : null}

      {/* Strongest signal */}
      {diagnosisSummary ? (
        <p
          className="max-w-3xl text-sm leading-7 text-brand-text-secondary"
          data-testid="report-audience-growth-summary"
        >
          {diagnosisSummary}
        </p>
      ) : null}

      {/* Platform cards */}
      {cards.length > 0 ? (
        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          data-testid="report-audience-growth-cards"
        >
          {cards.map((card) => (
            <PlatformCard key={card.id} card={card} />
          ))}
        </div>
      ) : emptyMessage ? (
        <p
          className="max-w-3xl text-sm leading-7 text-brand-text-secondary"
          data-testid="report-audience-growth-empty"
        >
          {emptyMessage}
        </p>
      ) : null}

      {/* Watchout + next best move */}
      {(watchout || nextBestMove) ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" data-testid="report-audience-growth-diagnosis">
          {watchout ? (
            <div
              className="rounded-xl border border-brand-border/50 bg-brand-panel-muted/30 p-4"
              style={{ borderLeftColor: "#f87171", borderLeftWidth: 3 }}
            >
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f87171]">Watch</p>
              <p className="text-sm leading-relaxed text-brand-text-secondary">{watchout}</p>
            </div>
          ) : null}
          {nextBestMove ? (
            <div
              className="rounded-xl border border-brand-border/50 bg-brand-panel-muted/30 p-4"
              style={{ borderLeftColor: "var(--es-color-accent-emerald)", borderLeftWidth: 3 }}
            >
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: "var(--es-color-accent-emerald)" }}>Next move</p>
              <p className="text-sm leading-relaxed text-brand-text-secondary">{nextBestMove}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Included sources chips */}
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
                  <span className="ml-2 text-brand-text-muted">
                    {[source.latestPeriodLabel, source.dataType].filter(Boolean).join(" | ")}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Trust note */}
      {model.trustNote ? (
        <p
          className="text-xs leading-6 text-brand-text-muted"
          data-testid="report-audience-growth-trust-note"
        >
          {model.trustNote}
        </p>
      ) : null}
    </div>
  );
}
