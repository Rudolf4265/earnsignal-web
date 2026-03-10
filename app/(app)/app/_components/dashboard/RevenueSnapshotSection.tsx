import { DashboardSectionHeader } from "./DashboardSectionHeader";
import { KpiCard } from "./KpiCard";
import { PanelCard } from "@/src/components/ui/panel-card";

type RevenueSnapshotSectionProps = {
  netRevenue: string;
  subscribers: string;
  stabilityIndex: string;
  churnVelocity: string;
};

export function RevenueSnapshotSection({
  netRevenue,
  subscribers,
  stabilityIndex,
  churnVelocity,
}: RevenueSnapshotSectionProps) {
  return (
    <section className="space-y-4" data-testid="dashboard-section-revenue-snapshot">
      <DashboardSectionHeader title="Revenue Snapshot" description="A quick read of current topline momentum." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <KpiCard label="Net Revenue" value={netRevenue} subtext="Last 30 days" />
        <KpiCard label="Subscribers" value={subscribers} subtext="Current" />
      </div>
      <PanelCard className="p-4" contentClassName="mt-0">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-brand-text-secondary">Stability Index</dt>
            <dd className="mt-1 text-sm text-brand-text-primary">{stabilityIndex}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-brand-text-secondary">Churn Velocity</dt>
            <dd className="mt-1 text-sm text-brand-text-primary">{churnVelocity}</dd>
          </div>
        </dl>
      </PanelCard>
    </section>
  );
}
