import type { DashboardViewModel } from "@/src/lib/dashboard/view-model";

type DashboardMetricStripProps = {
  revenueSnapshot: DashboardViewModel["revenueSnapshot"];
  stabilityIndex: number | null;
  coverageMonths: number | null;
};

type CompactTileProps = {
  label: string;
  value: string;
  subtext: string | null;
};

function CompactTile({ label, value, subtext }: CompactTileProps) {
  return (
    <article className="rounded-[1.2rem] border border-brand-border/70 bg-[linear-gradient(155deg,rgba(16,32,67,0.92),rgba(19,41,80,0.78),rgba(16,32,67,0.92))] px-4 py-4 shadow-brand-card">
      <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-brand-text-primary">{value}</p>
      {subtext ? (
        <p className="mt-1.5 text-xs leading-relaxed text-brand-text-muted">{subtext}</p>
      ) : null}
    </article>
  );
}

export function DashboardMetricStrip({ revenueSnapshot, stabilityIndex, coverageMonths }: DashboardMetricStripProps) {
  const stabilityDisplay = stabilityIndex !== null ? String(stabilityIndex) : "--";
  const coverageDisplay = coverageMonths !== null ? `${coverageMonths}mo` : "--";

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-testid="dashboard-metric-strip">
      <CompactTile
        label="Net Revenue"
        value={revenueSnapshot.revenueDisplay}
        subtext={revenueSnapshot.revenueDeltaText ?? "Comparison appears after enough report history."}
      />
      <CompactTile
        label="Subscribers"
        value={revenueSnapshot.subscribersDisplay}
        subtext={revenueSnapshot.subscriberDeltaText ?? "Comparison appears after enough report history."}
      />
      <CompactTile
        label="Stability Index"
        value={stabilityDisplay}
        subtext="Creator health score from the latest report."
      />
      <CompactTile
        label="Coverage"
        value={coverageDisplay}
        subtext="Months of data analyzed in the latest report."
      />
    </div>
  );
}
