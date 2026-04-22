"use client";

import { PanelCard } from "@/src/components/ui/panel-card";
import type { WowStrengthsRisksViewModel } from "@/src/lib/report/wow-summary-view-model";

function CheckIcon() {
  return (
    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-accent-emerald/20" aria-hidden="true">
      <svg viewBox="0 0 12 12" fill="none" className="h-2.5 w-2.5 text-brand-accent-emerald">
        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function WarnIcon() {
  return (
    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-400/18" aria-hidden="true">
      <svg viewBox="0 0 12 12" fill="none" className="h-2.5 w-2.5 text-amber-400">
        <path d="M6 2.5v3.5M6 8h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}

type Props = {
  model: WowStrengthsRisksViewModel;
};

export function ReportStrengthsRisksSection({ model }: Props) {
  if (!model.available) {
    return null;
  }

  return (
    <PanelCard
      className="border-brand-border/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(19,41,80,0.9),rgba(16,32,67,0.95))]"
      data-testid="report-strengths-risks"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
        Strengths &amp; Risks
      </p>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        {model.strengths.length > 0 ? (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-brand-accent-emerald">
              What improved
            </p>
            <ul className="space-y-3">
              {model.strengths.map((item) => (
                <li key={item.id} className="flex items-start gap-2.5">
                  <CheckIcon />
                  <p className="text-sm leading-relaxed text-brand-text-secondary">{item.text}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {model.risks.length > 0 ? (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-amber-400">
              Watch out for
            </p>
            <ul className="space-y-3">
              {model.risks.map((item) => (
                <li key={item.id} className="flex items-start gap-2.5">
                  <WarnIcon />
                  <p className="text-sm leading-relaxed text-brand-text-secondary">{item.text}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </PanelCard>
  );
}
