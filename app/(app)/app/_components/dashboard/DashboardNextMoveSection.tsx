"use client";

import Link from "next/link";
import { SkeletonBlock } from "../../../_components/ui/skeleton";
import type { DashboardActionCard, DashboardActionCardsMode } from "@/src/lib/dashboard/action-cards";

export type DashboardNextMoveSectionProps = {
  mode: DashboardActionCardsMode;
  topCard: DashboardActionCard | null;
  upgradeHref: string;
};

export function DashboardNextMoveSection({ mode, topCard, upgradeHref }: DashboardNextMoveSectionProps) {
  return (
    <section data-testid="dashboard-next-move-section">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
        #1 Next Move
      </p>

      {mode === "loading" && (
        <div className="rounded-[1.35rem] border border-brand-border/70 bg-[linear-gradient(145deg,rgba(13,28,62,0.95),rgba(18,42,82,0.88))] p-5 shadow-brand-card">
          <div className="space-y-3">
            <SkeletonBlock className="h-4 w-20 bg-brand-border/55" />
            <SkeletonBlock className="h-6 w-3/4 bg-brand-border/50" />
            <SkeletonBlock className="h-4 w-full bg-brand-border/40" />
            <SkeletonBlock className="h-4 w-5/6 bg-brand-border/35" />
          </div>
        </div>
      )}

      {mode === "locked" && (
        <div className="rounded-[1.35rem] border border-brand-border/60 bg-[linear-gradient(145deg,rgba(10,22,50,0.95),rgba(14,30,64,0.88))] p-5 shadow-brand-card">
          <p className="text-sm leading-relaxed text-brand-text-secondary">
            Unlock your personalised next-best-move by generating a report. EarnSigma surfaces the single highest-impact action for your business right now.
          </p>
          <Link
            href={upgradeHref}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-brand-accent-blue/50 bg-brand-accent-blue/10 px-4 py-2 text-sm font-semibold text-brand-accent-blue transition hover:bg-brand-accent-blue/20"
          >
            Get a report
          </Link>
        </div>
      )}

      {mode === "unlocked" && topCard && (
        <article className="relative overflow-hidden rounded-[1.35rem] border border-teal-500/30 bg-[linear-gradient(145deg,rgba(13,28,62,0.97),rgba(17,40,82,0.92),rgba(13,28,62,0.97))] p-5 shadow-[0_0_32px_rgba(20,184,166,0.07)] transition-shadow hover:shadow-[0_0_44px_rgba(20,184,166,0.11)]">
          {/* Subtle teal ambient glow */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-teal-500/8 blur-3xl" />

          <div className="relative space-y-2">
            {topCard.stateLabel && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-400">
                {topCard.stateLabel}
              </p>
            )}
            <p className="text-base font-semibold leading-snug text-brand-text-primary">
              {topCard.body}
            </p>
            {topCard.detail && (
              <p className="text-sm leading-relaxed text-brand-text-secondary">
                {topCard.detail}
              </p>
            )}
          </div>
        </article>
      )}

      {mode === "unlocked" && !topCard && (
        <div className="rounded-[1.35rem] border border-brand-border/60 bg-[linear-gradient(145deg,rgba(13,28,62,0.95),rgba(18,42,82,0.88))] p-5 shadow-brand-card">
          <p className="text-sm italic text-brand-text-muted">
            No actions recommended right now — your business looks healthy.
          </p>
        </div>
      )}
    </section>
  );
}
