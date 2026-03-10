import { DashboardSectionHeader } from "./DashboardSectionHeader";
import { PanelCard } from "@/src/components/ui/panel-card";

type InsightCardsSectionProps = {
  insights: string[];
};

export function InsightCardsSection({ insights }: InsightCardsSectionProps) {
  return (
    <section className="space-y-4" data-testid="dashboard-section-what-we-see">
      <DashboardSectionHeader title="What We See" description="Key observations from your latest completed analysis." />
      <PanelCard>
        <ul className="divide-y divide-brand-border">
          {insights.map((insight) => (
            <li key={insight} className="py-3 first:pt-0 last:pb-0">
              <p className="text-sm text-brand-text-secondary">{insight}</p>
            </li>
          ))}
        </ul>
      </PanelCard>
    </section>
  );
}
