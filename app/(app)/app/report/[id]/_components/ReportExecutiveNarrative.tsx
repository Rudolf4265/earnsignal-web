"use client";

import { PanelCard } from "@/src/components/ui/panel-card";

type Props = {
  paragraphs: string[];
  summarySentence: string | null;
};

export function ReportExecutiveNarrative({ paragraphs, summarySentence }: Props) {
  const usable = paragraphs.filter((p) => {
    const clean = p.trim();
    if (clean.length < 55) return false;
    if (!summarySentence) return true;
    const pStart = clean.slice(0, 45).toLowerCase().replace(/[^a-z0-9 ]/g, "");
    const sStart = summarySentence.trim().slice(0, 45).toLowerCase().replace(/[^a-z0-9 ]/g, "");
    return pStart !== sStart;
  });

  if (usable.length === 0) return null;

  return (
    <PanelCard
      className="border-brand-border/65 bg-[linear-gradient(155deg,rgba(14,28,58,0.94),rgba(16,32,67,0.9))]"
      data-testid="report-executive-narrative"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">Report narrative</p>
      <div className="mt-3 space-y-3">
        {usable.map((para, i) => (
          <p key={i} className="text-sm leading-relaxed text-brand-text-secondary">
            {para}
          </p>
        ))}
      </div>
    </PanelCard>
  );
}
