import { DashboardSectionHeader } from "./DashboardSectionHeader";
import { KpiCard } from "./KpiCard";
import type { DashboardViewModel } from "@/src/lib/dashboard/view-model";

type RevenueSnapshotSectionProps = {
  revenueSnapshot: DashboardViewModel["revenueSnapshot"];
};

export function RevenueSnapshotSection({ revenueSnapshot }: RevenueSnapshotSectionProps) {
  return (
    <section className="space-y-3" data-testid="dashboard-section-revenue-snapshot">
      <DashboardSectionHeader title="Revenue Snapshot" description="Just the numbers you need at a glance." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div data-testid="revenue-snapshot-card-revenue">
          <KpiCard
            label="Revenue"
            value={revenueSnapshot.revenueDisplay}
            subtext={revenueSnapshot.revenueDeltaText ?? "No revenue comparison available yet."}
            appearance="dashboard"
          />
        </div>
        <div data-testid="revenue-snapshot-card-subscribers">
          <KpiCard
            label="Subscribers"
            value={revenueSnapshot.subscribersDisplay}
            subtext={revenueSnapshot.subscriberDeltaText ?? "No subscriber comparison available yet."}
            appearance="dashboard"
          />
        </div>
      </div>
    </section>
  );
}
