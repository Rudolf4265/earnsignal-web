"use client";

import type { WowStrengthsRisksViewModel } from "@/src/lib/report/wow-summary-view-model";

type Props = {
  model: WowStrengthsRisksViewModel;
  opportunities?: string[];
};

function Column({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <ul className="space-y-2.5">
        {items.slice(0, 3).map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm leading-7 text-slate-600">
            <span className="mt-[0.8rem] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReportStrengthsRisksSection({ model, opportunities = [] }: Props) {
  if (!model.available) {
    return null;
  }

  return (
    <section
      className="rounded-[1.5rem] border border-slate-200/80 bg-white/70 px-5 py-5 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.28)] sm:px-6"
      data-testid="report-strengths-risks"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Column title="Strengths" items={model.strengths.map((item) => item.text)} />
        <Column title="Risks" items={model.risks.map((item) => item.text)} />
        <Column title="Opportunities" items={opportunities} />
      </div>
    </section>
  );
}
