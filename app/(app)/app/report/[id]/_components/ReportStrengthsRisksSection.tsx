"use client";

import type { WowStrengthsRisksViewModel } from "@/src/lib/report/wow-summary-view-model";

type Props = {
  model: WowStrengthsRisksViewModel;
  opportunities?: string[];
};

function toneClasses(title: string): { heading: string; bullet: string } {
  if (title === "Strengths") {
    return {
      heading: "text-brand-accent-emerald",
      bullet: "bg-brand-accent-emerald/80",
    };
  }

  if (title === "Risks") {
    return {
      heading: "text-amber-300",
      bullet: "bg-amber-300/80",
    };
  }

  return {
    heading: "text-brand-accent-blue",
    bullet: "bg-brand-accent-blue/80",
  };
}

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

  const tone = toneClasses(title);

  return (
    <div className="space-y-3">
      <h3 className={`text-sm font-semibold ${tone.heading}`}>{title}</h3>
      <ul className="space-y-2.5">
        {items.slice(0, 3).map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm leading-7 text-brand-text-secondary">
            <span className={`mt-[0.8rem] h-1.5 w-1.5 shrink-0 rounded-full ${tone.bullet}`} aria-hidden="true" />
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
      className="rounded-[1.5rem] border border-brand-border/70 bg-[linear-gradient(165deg,rgba(16,32,67,0.76),rgba(19,41,80,0.62),rgba(11,24,50,0.88))] px-5 py-5 shadow-brand-card sm:px-6"
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
