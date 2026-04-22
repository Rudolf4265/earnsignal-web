import { cn } from "@earnsigma/ui";
import type { SampleFinding, FindingTone } from "@/src/lib/sample-report/anna-reyes-fixture";

function toneStyles(tone: FindingTone) {
  switch (tone) {
    case "positive":
      return {
        border: "border-brand-accent-emerald/30",
        metricColor: "text-brand-accent-emerald",
        metricBg: "bg-brand-accent-emerald/8 border-brand-accent-emerald/25",
      };
    case "opportunity":
      return {
        border: "border-brand-accent-teal/30",
        metricColor: "text-brand-accent-teal",
        metricBg: "bg-brand-accent-teal/8 border-brand-accent-teal/25",
      };
    case "warning":
      return {
        border: "border-[#fbbf24]/30",
        metricColor: "text-[#fbbf24]",
        metricBg: "bg-[#fbbf24]/8 border-[#fbbf24]/25",
      };
    case "critical":
      return {
        border: "border-[#f87171]/30",
        metricColor: "text-[#f87171]",
        metricBg: "bg-[#f87171]/8 border-[#f87171]/25",
      };
  }
}

type SampleFindingCardProps = {
  finding: SampleFinding;
  className?: string;
};

export function SampleFindingCard({ finding, className }: SampleFindingCardProps) {
  const t = toneStyles(finding.tone);
  return (
    <div
      className={cn(
        "sample-report-card rounded-2xl border bg-[linear-gradient(165deg,rgba(17,34,69,0.92),rgba(11,24,50,0.86))] p-5",
        t.border,
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn("shrink-0 rounded-xl border px-3 py-2.5 text-center", t.metricBg)}>
          <p className={cn("text-xl font-bold leading-none tracking-tight", t.metricColor)}>
            {finding.metric}
          </p>
          <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-brand-text-muted">
            {finding.metricLabel}
          </p>
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-snug text-white">{finding.headline}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-brand-text-secondary">{finding.body}</p>
        </div>
      </div>
    </div>
  );
}
