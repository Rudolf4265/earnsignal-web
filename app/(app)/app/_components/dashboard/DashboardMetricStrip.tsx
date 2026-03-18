import type { DashboardViewModel } from "@/src/lib/dashboard/view-model";

type DashboardMetricStripProps = {
  revenueSnapshot: DashboardViewModel["revenueSnapshot"];
  churnVelocity: number | null;
  coverageMonths: number | null;
};

type CompactTileProps = {
  label: string;
  value: string;
  subtext: string | null;
};

function CompactTile({ label, value, subtext }: CompactTileProps) {
  return (
    <article className="rounded-[1.1rem] border border-brand-border/50 bg-[linear-gradient(155deg,rgba(16,32,67,0.9),rgba(19,41,80,0.74),rgba(16,32,67,0.9))] px-4 py-3.5 shadow-brand-card">
      <p className="text-[10px] uppercase tracking-[0.14em] text-brand-text-muted">{label}</p>
      <p className="mt-1.5 text-3xl font-semibold tracking-tight text-brand-text-primary">{value}</p>
      {subtext ? (
        <p className="mt-1 text-xs leading-relaxed text-brand-text-muted/80">{subtext}</p>
      ) : null}
    </article>
  );
}

export function DashboardMetricStrip({ revenueSnapshot, churnVelocity, coverageMonths }: DashboardMetricStripProps) {
  const churnDisplay = churnVelocity !== null ? `${churnVelocity}%` : "--";
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
        label="Churn Rate"
        value={churnDisplay}
        subtext="Churn velocity from latest report."
      />
      <CompactTile
        label="Coverage"
        value={coverageDisplay}
        subtext="Months of data analyzed in the latest report."
      />
    </div>
  );
}
