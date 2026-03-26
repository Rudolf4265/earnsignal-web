"use client";

import { PanelCard } from "@/src/components/ui/panel-card";
import type {
  ReportWowSummaryViewModel,
  WowKpiCard,
  WowTrendDirection,
} from "@/src/lib/report/wow-summary-view-model";

// ── Trend arrow glyph ─────────────────────────────────────────────────────────

function TrendArrow({ direction, className }: { direction: WowTrendDirection; className?: string }) {
  const base = `inline-block ${className ?? ""}`;
  if (direction === "up") {
    return (
      <svg viewBox="0 0 16 16" fill="none" className={`${base} h-4 w-4 text-brand-accent-teal`} aria-hidden="true">
        <path d="M8 13V3M3 8l5-5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (direction === "down") {
    return (
      <svg viewBox="0 0 16 16" fill="none" className={`${base} h-4 w-4 text-amber-400`} aria-hidden="true">
        <path d="M8 3v10M3 8l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (direction === "flat") {
    return (
      <svg viewBox="0 0 16 16" fill="none" className={`${base} h-4 w-4 text-brand-text-muted`} aria-hidden="true">
        <path d="M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  return null;
}

// ── KPI Strip ─────────────────────────────────────────────────────────────────

function KpiCard({ card }: { card: WowKpiCard }) {
  return (
    <article className="rounded-[1.1rem] border border-brand-border-strong/70 bg-[linear-gradient(155deg,rgba(16,32,67,0.96),rgba(19,41,80,0.9),rgba(16,32,67,0.95))] p-4">
      <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">{card.label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-brand-text-primary sm:text-3xl">{card.value}</p>
      {card.detail ? <p className="mt-1.5 text-[11px] uppercase tracking-[0.1em] text-brand-text-muted">{card.detail}</p> : null}
    </article>
  );
}

function ExecutiveSummaryStrip({ model }: { model: ReportWowSummaryViewModel }) {
  return (
    <div className="space-y-4" data-testid="wow-executive-strip">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {model.kpiCards.map((card) => (
          <KpiCard key={card.id} card={card} />
        ))}
      </div>
      {model.summarySentence ? (
        <p className="rounded-xl border border-brand-border/55 bg-brand-panel/50 px-4 py-3 text-sm leading-relaxed text-brand-text-secondary">
          {model.summarySentence}
        </p>
      ) : null}
    </div>
  );
}

function CoverageTrustPanel({ model }: { model: ReportWowSummaryViewModel }) {
  const hasCoverageCopy =
    Boolean(model.coverage.snapshotCoverageNote) ||
    model.coverage.reportHasBusinessMetrics === false ||
    model.coverage.sectionStrength.length > 0;

  if (!hasCoverageCopy) {
    return null;
  }

  return (
    <article
      className="rounded-[1.15rem] border border-brand-border-strong/70 bg-[linear-gradient(155deg,rgba(19,41,80,0.8),rgba(16,32,67,0.9))] p-4"
      data-testid="wow-coverage-trust"
    >
      <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Coverage</p>
      {model.coverage.snapshotCoverageNote ? (
        <p className="mt-3 text-sm leading-relaxed text-brand-text-secondary">{model.coverage.snapshotCoverageNote}</p>
      ) : null}
      {model.coverage.reportHasBusinessMetrics === false ? (
        <p className="mt-3 text-sm leading-relaxed text-amber-200">
          Limited by available business metrics. Revenue and subscriber insight is weaker in this snapshot.
        </p>
      ) : null}
      {model.coverage.sectionStrength.length > 0 ? (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {model.coverage.sectionStrength.map((section) => (
            <div key={section.id} className="rounded-xl border border-brand-border/60 bg-brand-panel/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-brand-text-primary">{section.label}</p>
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-text-muted">
                  {section.level}
                </span>
              </div>
              {section.reason ? (
                <p className="mt-2 text-xs leading-relaxed text-brand-text-secondary">{section.reason}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

// ── Biggest Opportunity ───────────────────────────────────────────────────────

function BiggestOpportunityCard({ model }: { model: ReportWowSummaryViewModel }) {
  const { opportunity } = model;
  return (
    <div data-testid="wow-biggest-opportunity">
      {opportunity.available ? (
        <article className="relative overflow-hidden rounded-[1.2rem] border border-brand-accent-emerald/35 bg-[linear-gradient(155deg,rgba(14,42,65,0.96),rgba(16,50,68,0.92),rgba(11,34,55,0.97))] p-5 shadow-brand-card">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-brand-accent-teal/12 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-accent-teal/60 via-brand-accent-teal/25 to-transparent" />
          <div className="relative flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-brand-accent-emerald/40 bg-brand-accent-emerald/12 text-brand-accent-teal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
                <path d="m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z" />
                <path d="m18.5 14.5.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9.9-2.3Z" />
              </svg>
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-accent-teal">Your biggest opportunity</p>
          </div>
          <p className="relative mt-3 text-base font-semibold leading-snug text-brand-text-primary">{opportunity.finding}</p>
          {opportunity.upsideLabel ? (
            <p className="relative mt-2 text-sm leading-relaxed text-brand-text-secondary">{opportunity.upsideLabel}</p>
          ) : null}
          <div className="relative mt-4 flex items-start gap-2.5 rounded-xl border border-brand-border/50 bg-brand-panel/40 px-3.5 py-2.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-accent-teal/70" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
            <p className="text-sm leading-relaxed text-brand-text-secondary">
              <span className="font-medium text-brand-text-primary">Recommended action — </span>
              {opportunity.action}
            </p>
          </div>
        </article>
      ) : (
        <div className="rounded-2xl border border-dashed border-brand-border-strong/70 bg-brand-panel-muted/70 p-4">
          <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-muted">Your biggest opportunity</p>
          <p className="mt-2 text-sm text-brand-text-secondary">{opportunity.finding}</p>
        </div>
      )}
    </div>
  );
}

// ── Platform Mix ──────────────────────────────────────────────────────────────

function PlatformMixPanel({ model }: { model: ReportWowSummaryViewModel }) {
  const { platformMix } = model;
  return (
    <article
      className="rounded-[1.15rem] border border-brand-border-strong/70 bg-[linear-gradient(155deg,rgba(19,41,80,0.8),rgba(16,32,67,0.9))] p-4"
      data-testid="wow-platform-mix"
    >
      <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Current Revenue Mix</p>
      {platformMix.available ? (
        <div className="mt-3 space-y-3">
          {platformMix.concentrationScore !== null ? (
            <div>
              <div className="flex items-end justify-between gap-2">
                <p className="text-2xl font-semibold tracking-tight text-brand-text-primary">
                  {Math.round(platformMix.concentrationScore)}%
                </p>
                <p className="mb-0.5 text-xs text-brand-text-muted">concentration</p>
              </div>
              <div className="mt-2 h-2 rounded-full bg-brand-panel-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-accent-blue to-brand-accent-emerald/70"
                  style={{ width: `${Math.max(8, Math.min(100, Math.round(platformMix.concentrationScore)))}%` }}
                  aria-hidden="true"
                />
              </div>
            </div>
          ) : null}
          <p className="text-sm leading-relaxed text-brand-text-secondary">{platformMix.interpretationText}</p>
          {platformMix.highlights.slice(0, 2).map((line) => (
            <p key={line} className="text-xs leading-relaxed text-brand-text-muted">{line}</p>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-brand-text-secondary">{platformMix.interpretationText}</p>
      )}
    </article>
  );
}

// ── Momentum ──────────────────────────────────────────────────────────────────

function MomentumPanel({ model }: { model: ReportWowSummaryViewModel }) {
  const { momentum } = model;
  return (
    <article
      className="rounded-[1.15rem] border border-brand-border-strong/70 bg-[linear-gradient(155deg,rgba(19,41,80,0.8),rgba(16,32,67,0.9))] p-4"
      data-testid="wow-momentum"
    >
      <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Momentum</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-brand-border/60 bg-brand-panel/60 p-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-brand-text-muted">Revenue</p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <TrendArrow direction={momentum.revenueTrend} />
            <p className="text-sm font-semibold capitalize text-brand-text-primary">
              {momentum.revenueTrend === "unknown" ? "Limited data" : momentum.revenueTrend}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-brand-border/60 bg-brand-panel/60 p-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-brand-text-muted">Subscribers</p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <TrendArrow direction={momentum.subscriberTrend} />
            <p className="text-sm font-semibold capitalize text-brand-text-primary">
              {momentum.subscriberTrend === "unknown" ? "Limited data" : momentum.subscriberTrend}
            </p>
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-brand-text-secondary">{momentum.summaryText}</p>
    </article>
  );
}

// ── Strengths vs Risks ────────────────────────────────────────────────────────

function StrengthsRisksSection({ model }: { model: ReportWowSummaryViewModel }) {
  const { strengthsRisks } = model;
  return (
    <div className="grid gap-4 sm:grid-cols-2" data-testid="wow-strengths-risks">
      <article className="rounded-[1.15rem] border border-brand-border/65 bg-[linear-gradient(155deg,rgba(14,34,60,0.9),rgba(11,28,52,0.94))] p-4">
        <p className="text-[11px] uppercase tracking-[0.14em] text-brand-accent-teal/80">Strengths</p>
        {strengthsRisks.strengths.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {strengthsRisks.strengths.map((item) => (
              <li key={item.id} className="flex items-start gap-2.5 text-sm leading-relaxed text-brand-text-secondary">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-accent-teal/70" aria-hidden="true" />
                {item.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-brand-text-secondary">
            Not enough comparative data to surface specific strengths yet.
          </p>
        )}
      </article>

      <article className="rounded-[1.15rem] border border-brand-border/65 bg-[linear-gradient(155deg,rgba(24,22,40,0.9),rgba(18,18,38,0.94))] p-4">
        <p className="text-[11px] uppercase tracking-[0.14em] text-amber-400/80">Risks</p>
        {strengthsRisks.risks.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {strengthsRisks.risks.map((item) => (
              <li key={item.id} className="flex items-start gap-2.5 text-sm leading-relaxed text-brand-text-secondary">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400/60" aria-hidden="true" />
                {item.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-brand-text-secondary">
            No specific risks were identified in this report period.
          </p>
        )}
      </article>
    </div>
  );
}

// ── Next 3 Actions ────────────────────────────────────────────────────────────

function NextActionsSection({ model }: { model: ReportWowSummaryViewModel }) {
  const { nextActions } = model;
  return (
    <div data-testid="wow-next-actions">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-accent-blue">Next 3 Actions</p>
      {nextActions.length > 0 ? (
        <ol className="space-y-2.5">
          {nextActions.map((action, index) => (
            <li
              key={action.id}
              className={`relative flex items-start gap-3.5 overflow-hidden rounded-[1.1rem] border p-4 ${
                index === 0
                  ? "border-brand-accent-teal/22 bg-[linear-gradient(155deg,rgba(18,40,82,0.92),rgba(14,30,60,0.94))] shadow-brand-glow"
                  : "border-brand-border/45 bg-brand-panel/40"
              }`}
            >
              {index === 0 ? (
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-accent-teal/55 via-brand-accent-teal/22 to-transparent" />
              ) : null}
              <span className="relative mt-0.5 flex-shrink-0 text-[11px] font-semibold tabular-nums text-brand-text-muted">
                {index + 1}.
              </span>
              <div className="relative min-w-0">
                <p className="text-sm leading-relaxed text-brand-text-secondary">{action.title}</p>
                {action.detail ? (
                  <p className="mt-1 text-xs leading-relaxed text-brand-text-muted">{action.detail}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="rounded-2xl border border-dashed border-brand-border-strong/70 bg-brand-panel-muted/70 p-4">
          <p className="text-sm text-brand-text-secondary">
            Prioritized action recommendations are not available in this report artifact.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type ReportWowSummaryProps = {
  model: ReportWowSummaryViewModel;
};

export function ReportWowSummary({ model }: ReportWowSummaryProps) {
  return (
    <section className="space-y-4" data-testid="report-wow-summary">
      <PanelCard className="border-brand-border-strong/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(19,41,80,0.88),rgba(16,32,67,0.95))]">
        <ExecutiveSummaryStrip model={model} />
      </PanelCard>

      <CoverageTrustPanel model={model} />

      <BiggestOpportunityCard model={model} />

      <div className="grid gap-4 sm:grid-cols-2">
        <PlatformMixPanel model={model} />
        <MomentumPanel model={model} />
      </div>

      <PanelCard className="border-brand-border/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(19,41,80,0.88),rgba(16,32,67,0.95))]">
        <StrengthsRisksSection model={model} />
      </PanelCard>

      <PanelCard className="border-brand-border/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(19,41,80,0.88),rgba(16,32,67,0.95))]">
        <NextActionsSection model={model} />
      </PanelCard>
    </section>
  );
}
