import Link from "next/link";
import { Badge } from "./Badge";
import { DashboardSectionHeader } from "./DashboardSectionHeader";
import { buttonClassName } from "@/src/components/ui/button";
import { PanelCard } from "@/src/components/ui/panel-card";
import type { DashboardActionCard, DashboardActionCardsMode } from "@/src/lib/dashboard/action-cards";

type ActionCardsSectionProps = {
  mode: DashboardActionCardsMode;
  cards: DashboardActionCard[];
  presentation?: "default" | "hero";
};

export function ActionCardsSection({ mode, cards, presentation = "default" }: ActionCardsSectionProps) {
  const isHero = presentation === "hero";
  const featuredCard = cards[0] ?? null;
  const supportingCards = cards.slice(1);

  return (
    <section className="space-y-3" data-testid="dashboard-section-what-to-do-next">
      <DashboardSectionHeader title="Next best move" description="Clear next steps based on currently available signals." />

      <PanelCard className="border-brand-border/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.96),rgba(21,44,88,0.92),rgba(16,32,67,0.96))]">
        {mode === "unlocked" ? (
          <div className="space-y-4" data-testid="dashboard-action-cards-unlocked">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-brand-text-secondary">Next best move</p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight text-brand-text-primary">
                Start with the clearest action from the latest report.
              </h3>
            </div>

            {featuredCard ? (
              <article className="rounded-[1.2rem] border border-brand-border-strong/70 bg-[linear-gradient(155deg,rgba(21,46,90,0.9),rgba(14,30,58,0.92))] p-5 shadow-brand-card">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-muted">{featuredCard.label || "Recommended action"}</p>
                  {featuredCard.stateLabel ? <Badge variant={featuredCard.stateTone ?? "neutral"}>{featuredCard.stateLabel}</Badge> : null}
                </div>
                <p className="mt-3 text-base font-medium leading-relaxed text-brand-text-primary">{featuredCard.body}</p>
                {featuredCard.detail ? <p className="mt-3 text-sm leading-relaxed text-brand-text-secondary">{featuredCard.detail}</p> : null}
              </article>
            ) : null}

            {supportingCards.length > 0 ? (
              <ul className="space-y-3">
                {supportingCards.map((card, index) => (
                  <li
                    key={card.id}
                    className="rounded-[1rem] border border-brand-border/75 bg-[linear-gradient(155deg,rgba(19,41,80,0.78),rgba(16,32,67,0.88))] p-4 shadow-brand-card"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-muted">{card.label || `Recommendation ${index + 2}`}</p>
                      {card.stateLabel ? <Badge variant={card.stateTone ?? "neutral"}>{card.stateLabel}</Badge> : null}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">{card.body}</p>
                    {card.detail ? <p className="mt-3 text-xs leading-relaxed text-brand-text-muted">{card.detail}</p> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : mode === "locked" ? (
          <div
            className="relative flex h-full flex-col justify-between gap-5 overflow-hidden rounded-2xl border border-brand-border-strong/80 bg-[linear-gradient(155deg,rgba(16,32,67,0.95),rgba(23,49,117,0.78),rgba(15,118,110,0.32))] p-5 shadow-brand-card"
            data-testid="dashboard-action-cards-locked"
          >
            <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-brand-accent-blue/20 blur-3xl" />
            <div className="pointer-events-none absolute -left-14 bottom-[-4.5rem] h-36 w-36 rounded-full bg-brand-accent-emerald/16 blur-3xl" />
            <div className="relative space-y-3">
              <p className="inline-flex rounded-full border border-brand-border-strong/80 bg-brand-panel/72 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-accent-teal">
                PRO FEATURE
              </p>
              <h3 className="text-xl font-semibold tracking-tight text-brand-text-primary">Unlock prioritized next actions.</h3>
              <p className="text-sm leading-relaxed text-brand-text-secondary">
                Upgrade to Pro to unlock tailored next steps based on your revenue, subscriber, and diagnosis signals.
              </p>
            </div>
            <Link
              href="/app/billing"
              className={buttonClassName({ variant: "primary", size: "sm", className: "relative z-10 self-start px-4 shadow-brand-glow" })}
            >
              Upgrade to Pro
            </Link>
          </div>
        ) : (
          <div
            className="rounded-2xl border border-brand-border/75 bg-[linear-gradient(155deg,rgba(19,41,80,0.74),rgba(16,32,67,0.86))] p-4"
            data-testid="dashboard-action-cards-loading"
          >
            <p className="text-sm text-brand-text-secondary">Checking access to premium next actions...</p>
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
