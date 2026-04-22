"use client";

export type StatTileTone = "positive" | "warning" | "opportunity" | "neutral";

function badgeClass(tone: StatTileTone): string {
  if (tone === "positive") return "border-brand-accent-emerald/45 bg-brand-accent-emerald/12 text-brand-accent-emerald";
  if (tone === "warning") return "border-amber-400/40 bg-amber-400/12 text-amber-300";
  if (tone === "opportunity") return "border-brand-accent-blue/45 bg-brand-accent-blue/12 text-brand-accent-blue";
  return "border-brand-border-strong/55 bg-brand-panel/60 text-brand-text-muted";
}

function meterClass(tone: StatTileTone): string {
  if (tone === "positive") return "bg-brand-accent-emerald";
  if (tone === "warning") return "bg-amber-400";
  if (tone === "opportunity") return "bg-brand-accent-blue";
  return "bg-brand-text-muted/40";
}

export type ReportStatTileProps = {
  label: string;
  value: string;
  badge?: string | null;
  tone?: StatTileTone;
  meterPct?: number | null;
  detail?: string | null;
  testId?: string;
};

export function ReportStatTile({
  label,
  value,
  badge,
  tone = "neutral",
  meterPct,
  detail,
  testId,
}: ReportStatTileProps) {
  return (
    <div
      className="rounded-[1.05rem] border border-brand-border/70 bg-[linear-gradient(165deg,rgba(17,34,69,0.9),rgba(11,24,50,0.84))] p-4"
      data-testid={testId}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-brand-text-muted">{label}</p>
        {badge ? (
          <span
            className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] ${badgeClass(tone)}`}
          >
            {badge}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-xl font-semibold tracking-tight text-brand-text-primary">{value}</p>
      {meterPct != null ? (
        <div className="mt-3 h-1 rounded-full bg-brand-panel-muted/60" aria-hidden="true">
          <div
            className={`h-full rounded-full ${meterClass(tone)}`}
            style={{ width: `${Math.min(100, Math.max(0, meterPct))}%` }}
          />
        </div>
      ) : null}
      {detail ? (
        <p className="mt-1.5 text-xs leading-relaxed text-brand-text-muted">{detail}</p>
      ) : null}
    </div>
  );
}
