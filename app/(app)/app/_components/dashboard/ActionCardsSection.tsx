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
      <PanelCard className="border-brand-border/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(19,41,80,0.9),rgba(16,32,67,0.95))]">
        {mode === "unlocked" ? (
          <ul className="space-y-3" data-testid="dashboard-action-cards-unlocked">
            {cards.map((card, index) => (
              <li
                key={card.id}
                className="rounded-xl border border-brand-border/75 bg-[linear-gradient(155deg,rgba(19,41,80,0.78),rgba(16,32,67,0.88))] p-4 shadow-brand-card"
              >
                <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-muted">{`Action ${index + 1}`}</p>
                <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">{card.body}</p>
              </li>
            ))}
          </ul>
        ) : mode === "locked" ? (
          <div
            className="relative flex flex-wrap items-end justify-between gap-4 overflow-hidden rounded-2xl border border-brand-border-strong/80 bg-[linear-gradient(155deg,rgba(16,32,67,0.95),rgba(23,49,117,0.78),rgba(15,118,110,0.32))] p-5 shadow-brand-card"
            data-testid="dashboard-action-cards-locked"
          >
            <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-brand-accent-blue/20 blur-3xl" />
            <div className="pointer-events-none absolute -left-14 bottom-[-4.5rem] h-36 w-36 rounded-full bg-brand-accent-emerald/16 blur-3xl" />
            <div className="space-y-1">
              <p className="inline-flex rounded-full border border-brand-border-strong/80 bg-brand-panel/72 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-accent-teal">
                PRO FEATURE
              </p>
              <p className="text-sm leading-relaxed text-brand-text-secondary">
                Upgrade to Pro to unlock tailored growth recommendations based on your revenue and subscriber patterns.
              </p>
            </div>
            <Link
              href="/app/billing"
              className={buttonClassName({ variant: "primary", size: "sm", className: "relative z-10 px-4 shadow-brand-glow" })}
            >
              Upgrade to Pro
            </Link>
          </div>
        ) : (
          <div
            className="rounded-2xl border border-brand-border/75 bg-[linear-gradient(155deg,rgba(19,41,80,0.74),rgba(16,32,67,0.86))] p-4"
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
