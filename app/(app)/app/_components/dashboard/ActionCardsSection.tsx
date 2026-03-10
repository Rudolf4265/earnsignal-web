import { DashboardSectionHeader } from "./DashboardSectionHeader";
import { PanelCard } from "@/src/components/ui/panel-card";

type ActionCardsSectionProps = {
  actions: string[];
};

export function ActionCardsSection({ actions }: ActionCardsSectionProps) {
  return (
    <section className="space-y-4" data-testid="dashboard-section-what-to-do-next">
      <DashboardSectionHeader title="What To Do Next" description="Clear next steps based on currently available signals." />
      <PanelCard>
        <ul className="divide-y divide-brand-border">
          {actions.map((action) => (
            <li key={action} className="py-3 first:pt-0 last:pb-0">
              <p className="text-sm text-brand-text-secondary">{action}</p>
            </li>
          ))}
        </ul>
      </PanelCard>
    </section>
  );
}
