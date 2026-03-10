import Link from "next/link";
import { DashboardSectionHeader } from "./DashboardSectionHeader";
import { buttonClassName } from "@/src/components/ui/button";
import { PanelCard } from "@/src/components/ui/panel-card";
import type { DashboardActionCard, DashboardActionCardsMode } from "@/src/lib/dashboard/action-cards";

type ActionCardsSectionProps = {
  mode: DashboardActionCardsMode;
  cards: DashboardActionCard[];
};

export function ActionCardsSection({ mode, cards }: ActionCardsSectionProps) {
  return (
    <section className="space-y-3" data-testid="dashboard-section-what-to-do-next">
      <DashboardSectionHeader title="What To Do Next" description="Clear next steps based on currently available signals." />
      <PanelCard className="border-brand-border/70 bg-gradient-to-br from-brand-panel to-brand-panel-muted/90">
        {mode === "unlocked" ? (
          <ul className="divide-y divide-brand-border" data-testid="dashboard-action-cards-unlocked">
            {cards.map((card) => (
              <li key={card.id} className="py-3 first:pt-0 last:pb-0">
                <p className="text-sm text-brand-text-secondary">{card.body}</p>
              </li>
            ))}
          </ul>
        ) : mode === "locked" ? (
          <div
            className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-brand-border-strong/70 bg-brand-panel-muted/70 p-4"
            data-testid="dashboard-action-cards-locked"
          >
            <div className="space-y-1">
              <p className="inline-flex rounded-full border border-brand-border px-2 py-0.5 text-[11px] uppercase tracking-wide text-brand-text-secondary">
                Pro feature
              </p>
              <p className="text-sm text-brand-text-secondary">
                Upgrade to Pro to unlock tailored growth recommendations based on your revenue and subscriber patterns.
              </p>
            </div>
            <Link href="/app/billing" className={buttonClassName({ variant: "secondary", size: "sm" })}>
              Upgrade to Pro
            </Link>
          </div>
        ) : (
          <div
            className="rounded-2xl border border-brand-border/70 bg-brand-panel-muted/65 p-4"
            data-testid="dashboard-action-cards-loading"
          >
            <p className="text-sm text-brand-text-secondary">Checking plan access for tailored recommendations...</p>
            <div className="mt-3 space-y-2">
              <div className="h-2.5 w-full animate-pulse rounded-full bg-brand-border/70" />
              <div className="h-2.5 w-4/5 animate-pulse rounded-full bg-brand-border/55" />
            </div>
          </div>
        )}
      </PanelCard>
    </section>
  );
}
