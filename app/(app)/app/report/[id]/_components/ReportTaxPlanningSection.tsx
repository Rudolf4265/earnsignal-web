"use client";

import { PanelCard } from "@/src/components/ui/panel-card";
import type { ReportDetailTaxPlanningPresentation } from "@/src/lib/report/detail-presentation";

type Props = {
  model: ReportDetailTaxPlanningPresentation;
};

export function ReportTaxPlanningSection({ model }: Props) {
  return (
    <PanelCard
      className="space-y-5 border-brand-border/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(19,41,80,0.9),rgba(16,32,67,0.95))]"
      data-testid="report-tax-planning-section"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-accent-teal">
            Business Income & Tax Planning
          </p>
          <p className="mt-1 text-xs leading-relaxed text-brand-text-muted">
            Off-platform income summary and estimated tax set-aside.
          </p>
        </div>
      </div>

      {/* YTD hero cards */}
      <div className="grid grid-cols-2 gap-3">
        <article
          className="rounded-[1rem] border border-brand-accent-teal/25 bg-[linear-gradient(155deg,rgba(18,40,82,0.92),rgba(14,30,60,0.94))] p-4"
          data-testid="report-tax-planning-ytd"
        >
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-accent-teal/55 via-brand-accent-teal/22 to-transparent" />
          <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-muted">{model.ytdLabel} Income</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-brand-text-primary">{model.ytdTotal}</p>
        </article>
        <article
          className="rounded-[1rem] border border-brand-border-strong/70 bg-[linear-gradient(155deg,rgba(19,41,80,0.82),rgba(16,32,67,0.92))] p-4"
          data-testid="report-tax-planning-reserve"
        >
          <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-muted">
            Suggested {model.taxReservePctLabel} Tax Set-Aside
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-brand-accent-teal">{model.taxReserve}</p>
        </article>
      </div>

      {/* Quarterly breakdown */}
      {model.quarterlyTotals.length > 0 ? (
        <div data-testid="report-tax-planning-quarterly">
          <p className="mb-2.5 text-[11px] uppercase tracking-[0.14em] text-brand-text-muted">Quarterly Totals</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {model.quarterlyTotals.map((q) => (
              <div
                key={q.quarter}
                className="rounded-lg border border-brand-border/60 bg-brand-panel/50 px-3 py-2.5"
              >
                <p className="text-[10px] uppercase tracking-[0.12em] text-brand-text-muted">{q.quarter}</p>
                <p className="mt-1 text-sm font-semibold text-brand-text-primary">{q.formattedTotal}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Category breakdown */}
      {model.categoryBreakdown.length > 0 ? (
        <div data-testid="report-tax-planning-categories">
          <p className="mb-2.5 text-[11px] uppercase tracking-[0.14em] text-brand-text-muted">Income by Category</p>
          <div className="space-y-2">
            {model.categoryBreakdown.map((cat) => (
              <div key={cat.category} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-medium text-brand-text-primary">{cat.label}</p>
                    <p className="text-sm font-semibold text-brand-text-primary">{cat.formattedTotal}</p>
                  </div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-brand-border/40">
                    <div
                      className="h-full rounded-full bg-brand-accent-teal/60"
                      style={{ width: `${Math.round(cat.pct * 100)}%` }}
                    />
                  </div>
                </div>
                <p className="w-10 text-right text-xs text-brand-text-muted">{cat.formattedPct}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Top income sources */}
      {model.hasTopSources ? (
        <div data-testid="report-tax-planning-sources">
          <p className="mb-2.5 text-[11px] uppercase tracking-[0.14em] text-brand-text-muted">Top Income Sources</p>
          <div className="space-y-1.5">
            {model.topSourceRows.map((source, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 rounded-lg border border-brand-border/50 bg-brand-panel/40 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-brand-text-primary">{source.sourceName}</p>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-brand-text-muted">{source.categoryLabel}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-brand-text-primary">{source.formattedTotal}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Quarterly planning cues */}
      {model.planningCues.length > 0 ? (
        <div className="space-y-2" data-testid="report-tax-planning-cues">
          <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-muted">Quarterly Planning Reminders</p>
          {model.planningCues.map((cue) => (
            <div
              key={cue.quarter}
              className="rounded-xl border border-brand-accent-teal/20 bg-brand-panel/50 px-4 py-3"
              data-testid={`report-tax-planning-cue-${cue.quarter.replace(/\s+/g, "-").toLowerCase()}`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-accent-teal">{cue.quarter} · Due {cue.dueDateLabel}</p>
              <p className="mt-1 text-sm leading-relaxed text-brand-text-secondary">{cue.cueText}</p>
            </div>
          ))}
        </div>
      ) : null}

      {/* CSV export */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] leading-relaxed text-brand-text-muted">Export your full income record for your accountant.</p>
        <a
          href="/api/v1/business-income/export.csv"
          download="earnsigma-business-income.csv"
          className="shrink-0 rounded-lg border border-brand-border/70 bg-brand-panel/60 px-3.5 py-2 text-xs font-medium text-brand-text-secondary hover:border-brand-accent-teal/40 hover:text-brand-text-primary transition-colors"
          data-testid="report-tax-planning-csv-download"
        >
          Download CSV
        </a>
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl border border-brand-border/50 bg-brand-panel/40 px-4 py-3" data-testid="report-tax-planning-disclaimer">
        <p className="text-[11px] leading-relaxed text-brand-text-muted">{model.disclaimer}</p>
      </div>
    </PanelCard>
  );
}
