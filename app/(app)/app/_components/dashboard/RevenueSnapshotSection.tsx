import { DashboardSectionHeader } from "./DashboardSectionHeader";
import { KpiCard } from "./KpiCard";
import type { DashboardViewModel } from "@/src/lib/dashboard/view-model";

type RevenueSnapshotSectionProps = {
  revenueSnapshot: DashboardViewModel["revenueSnapshot"];
};

export function RevenueSnapshotSection({ revenueSnapshot }: RevenueSnapshotSectionProps) {
  return (
    <section className="space-y-3.5" data-testid="dashboard-section-revenue-snapshot">
      <DashboardSectionHeader title="Key metrics" description="Revenue and subscriber baseline from the latest completed report." />
      <div className="rounded-2xl border border-brand-border/70 bg-[linear-gradient(155deg,rgba(16,32,67,0.92),rgba(19,41,80,0.78),rgba(16,32,67,0.92))] p-4 md:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div data-testid="revenue-snapshot-card-revenue">
            <KpiCard
              label="Revenue"
              value={revenueSnapshot.revenueDisplay}
              subtext={revenueSnapshot.revenueDeltaText ?? "Comparison appears after enough report history is available."}
              appearance="dashboard"
            />
          </div>
          <div data-testid="revenue-snapshot-card-subscribers">
            <KpiCard
              label="Subscribers"
              value={revenueSnapshot.subscribersDisplay}
              subtext={revenueSnapshot.subscriberDeltaText ?? "Comparison appears after enough report history is available."}
              appearance="dashboard"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
