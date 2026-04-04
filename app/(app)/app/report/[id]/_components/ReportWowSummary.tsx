"use client";

import { PanelCard } from "@/src/components/ui/panel-card";
import type { ReportWowSummaryViewModel } from "@/src/lib/report/wow-summary-view-model";

function KpiCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-[1.05rem] border border-brand-border-strong/70 bg-[linear-gradient(155deg,rgba(16,32,67,0.96),rgba(19,41,80,0.9),rgba(16,32,67,0.95))] p-4">
      <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-brand-text-primary sm:text-3xl">{value}</p>
    </article>
  );
}

function ExecutiveSummaryCard({ summarySentence }: { summarySentence: string | null }) {
  if (!summarySentence) {
    return null;
  }

  return (
    <PanelCard
      className="border-brand-border-strong/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.96),rgba(23,49,117,0.84),rgba(15,118,110,0.22))]"
      data-testid="report-executive-summary-card"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-accent-teal">Executive Summary</p>
      <p className="mt-3 max-w-4xl text-base leading-8 text-brand-text-primary sm:text-[1.02rem]">{summarySentence}</p>
    </PanelCard>
  );
}

function KpiStripSection({ model }: { model: ReportWowSummaryViewModel }) {
  return (
    <PanelCard
      className="border-brand-border-strong/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(19,41,80,0.88),rgba(16,32,67,0.95))]"
      data-testid="report-kpi-strip"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="wow-executive-strip">
        {model.kpiCards.map((card) => (
          <KpiCard key={card.id} label={card.label} value={card.value} />
        ))}
      </div>
      {model.kpiContext ? (
        <p className="mt-3 border-t border-brand-border/40 pt-3 text-sm leading-relaxed text-brand-text-secondary" data-testid="wow-kpi-context">
          {model.kpiContext}
        </p>
      ) : null}
    </PanelCard>
  );
}

function BiggestRiskCard({ model }: { model: ReportWowSummaryViewModel }) {
  if (!model.biggestRisk.available) {
    return null;
  }

  return (
    <article
      className="relative overflow-hidden rounded-[1.2rem] border border-amber-400/30 bg-[linear-gradient(155deg,rgba(30,20,10,0.96),rgba(40,24,10,0.92),rgba(28,18,8,0.97))] p-5 shadow-brand-card"
      data-testid="wow-biggest-risk"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-400/55 via-amber-400/22 to-transparent" />
      <p className="relative text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-400">Biggest Risk</p>
      <p className="relative mt-3 text-lg font-semibold leading-snug text-brand-text-primary">{model.biggestRisk.headline}</p>
      <p className="relative mt-2 text-sm leading-relaxed text-brand-text-secondary">{model.biggestRisk.body}</p>
    </article>
  );
}

function BiggestOpportunityCard({ model }: { model: ReportWowSummaryViewModel }) {
  const { opportunity } = model;

  return (
    <article
      className="relative overflow-hidden rounded-[1.2rem] border border-brand-accent-emerald/35 bg-[linear-gradient(155deg,rgba(14,42,65,0.96),rgba(16,50,68,0.92),rgba(11,34,55,0.97))] p-5 shadow-brand-card"
      data-testid="wow-biggest-opportunity"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-brand-accent-teal/12 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-accent-teal/60 via-brand-accent-teal/25 to-transparent" />
      <p className="relative text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-accent-teal">Biggest Opportunity</p>
      <p className="relative mt-3 text-lg font-semibold leading-snug text-brand-text-primary">{opportunity.finding}</p>
      <p className="relative mt-2 text-sm leading-relaxed text-brand-text-secondary">{opportunity.action}</p>
      {opportunity.upsideLabel ? (
        <p className="relative mt-3 text-xs leading-relaxed text-brand-text-muted">{opportunity.upsideLabel}</p>
      ) : null}
    </article>
  );
}

function CompactSignalTile({
  title,
  headline,
  body,
  testId,
}: {
  title: string;
  headline: string;
  body: string | null;
  testId: string;
}) {
  return (
    <article
      className="rounded-[1.05rem] border border-brand-border-strong/70 bg-[linear-gradient(155deg,rgba(19,41,80,0.8),rgba(16,32,67,0.9))] p-4"
      data-testid={testId}
    >
      <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">{title}</p>
      <p className="mt-2 text-base font-semibold leading-snug text-brand-text-primary">{headline}</p>
      {body ? <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">{body}</p> : null}
    </article>
  );
}

type ReportWowSummaryProps = {
  model: ReportWowSummaryViewModel;
};

export function ReportWowSummary({ model }: ReportWowSummaryProps) {
  const incomeRiskBody = model.platformMix.highlights[0] ?? null;

  return (
    <section className="space-y-4" data-testid="report-wow-summary">
      <ExecutiveSummaryCard summarySentence={model.summarySentence} />
      <KpiStripSection model={model} />
      <BiggestRiskCard model={model} />
      <BiggestOpportunityCard model={model} />
      <div className="grid gap-4 sm:grid-cols-2">
        <CompactSignalTile
          title="Income Risk"
          headline={model.platformMix.interpretationText}
          body={incomeRiskBody}
          testId="wow-income-risk"
        />
        <CompactSignalTile
          title="Momentum"
          headline={model.momentum.headline}
          body={model.momentum.summaryText}
          testId="wow-momentum"
        />
      </div>
    </section>
  );
}
