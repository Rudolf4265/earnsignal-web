"use client";

import { PanelCard } from "@/src/components/ui/panel-card";
import type { ReportDetailOutlookCard, ReportDetailPresentationModel } from "@/src/lib/report/detail-presentation";

type RevenueOutlook = ReportDetailPresentationModel["revenueOutlook"];

function levelBadgeClass(stateTone: "good" | "warn" | "neutral" | null | undefined): string {
  if (stateTone === "good") return "border-brand-accent-emerald/40 bg-brand-accent-emerald/10 text-brand-accent-emerald";
  if (stateTone === "warn") return "border-amber-400/35 bg-amber-400/10 text-amber-300";
  return "border-brand-border-strong/55 bg-brand-panel/60 text-brand-text-muted";
}

function OutlookCard({ card }: { card: ReportDetailOutlookCard }) {
  return (
    <article
      className="rounded-[1.1rem] border border-brand-border/65 bg-[linear-gradient(155deg,rgba(16,32,67,0.90),rgba(19,41,80,0.84))] p-4"
      data-testid={`report-outlook-card-${card.id}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-text-muted">{card.title}</p>
        {card.stateLabel ? (
          <span
            className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] ${levelBadgeClass(card.stateTone)}`}
          >
            {card.stateLabel}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">{card.body}</p>
    </article>
  );
}

type Props = {
  model: RevenueOutlook;
};

export function ReportOutlookSection({ model }: Props) {
  if (model.cards.length === 0 && model.highlights.length === 0) return null;

  return (
    <section className="space-y-3" data-testid="report-outlook-section">
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">Outlook</p>
        <p className="text-xs text-brand-text-muted">Forward-looking risk and opportunity signals from this report.</p>
      </div>
      {model.cards.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {model.cards.map((card) => (
            <OutlookCard key={card.id} card={card} />
          ))}
        </div>
      ) : null}
      {model.highlights.length > 0 ? (
        <PanelCard className="border-brand-border/60 bg-brand-panel/50">
          <ul className="space-y-1.5">
            {model.highlights.map((line, i) => (
              <li key={i} className="text-sm leading-relaxed text-brand-text-secondary">
                {line}
              </li>
            ))}
          </ul>
        </PanelCard>
      ) : null}
    </section>
  );
}
