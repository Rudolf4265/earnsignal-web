"use client";

import type { ReportDetailPresentationModel } from "@/src/lib/report/detail-presentation";

type Props = {
  diagnosis: ReportDetailPresentationModel["diagnosis"];
};

export function ReportDiagnosisCallout({ diagnosis }: Props) {
  if (!diagnosis.diagnosisTypeLabel || !diagnosis.summary) {
    return null;
  }

  return (
    <article
      className="relative overflow-hidden rounded-2xl border border-brand-accent-blue/35 bg-[linear-gradient(155deg,rgba(15,28,62,0.96),rgba(20,40,85,0.92),rgba(15,28,62,0.97))] p-5"
      data-testid="report-diagnosis-callout"
    >
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-accent-blue/60 via-brand-accent-blue/22 to-transparent" />
      <div className="flex flex-wrap items-center gap-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-accent-blue">
          Business Diagnosis
        </p>
        <span className="inline-flex rounded-full border border-brand-accent-blue/45 bg-brand-accent-blue/12 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-accent-blue">
          {diagnosis.diagnosisTypeLabel}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-brand-text-secondary">{diagnosis.summary}</p>
      {diagnosis.primitives.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-brand-border/35 pt-4 sm:grid-cols-3">
          {diagnosis.primitives.map((primitive) => (
            <div key={primitive.label}>
              <p className="text-[10px] uppercase tracking-[0.12em] text-brand-text-muted">{primitive.label}</p>
              <p className="mt-0.5 text-xs font-semibold text-brand-text-primary">{primitive.value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}
