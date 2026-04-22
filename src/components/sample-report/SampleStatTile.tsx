import { cn } from "@earnsigma/ui";

export type StatTileTone = "positive" | "warning" | "opportunity";

export type SampleStatTileProps = {
  label: string;
  value: string;
  badge: string;
  tone: StatTileTone;
  meterPct: number;
  className?: string;
};

function tileToneStyles(tone: StatTileTone) {
  switch (tone) {
    case "positive":
      return {
        meter: "bg-brand-accent-emerald",
        badge: "border-brand-accent-emerald/40 bg-brand-accent-emerald/10 text-brand-accent-emerald",
      };
    case "warning":
      return {
        meter: "bg-[#fbbf24]",
        badge: "border-[#fbbf24]/40 bg-[#fbbf24]/10 text-[#fbbf24]",
      };
    case "opportunity":
      return {
        meter: "bg-brand-accent-teal",
        badge: "border-brand-accent-teal/40 bg-brand-accent-teal/10 text-brand-accent-teal",
      };
  }
}

export function SampleStatTile({
  label,
  value,
  badge,
  tone,
  meterPct,
  className,
}: SampleStatTileProps) {
  const t = tileToneStyles(tone);
  const clampedPct = Math.min(100, Math.max(0, meterPct));
  return (
    <div
      className={cn(
        "sample-report-card rounded-xl border border-brand-border/70 bg-[linear-gradient(165deg,rgba(17,34,69,0.9),rgba(12,26,55,0.84))] p-4 sm:p-5",
        className,
      )}
    >
      <p className="text-[10px] uppercase tracking-[0.12em] text-brand-text-muted">{label}</p>
      <p className="mt-2.5 text-base font-semibold leading-snug text-white">{value}</p>
      <div className="mt-3.5 flex items-center gap-2.5">
        <div className="h-1.5 min-w-0 flex-1 rounded-full bg-brand-panel-muted/80">
          <div
            className={cn("h-full rounded-full", t.meter)}
            style={{ width: `${clampedPct}%` }}
            aria-hidden="true"
          />
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]",
            t.badge,
          )}
        >
          {badge}
        </span>
      </div>
    </div>
  );
}
