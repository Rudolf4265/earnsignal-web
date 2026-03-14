import Link from "next/link";
import { Badge } from "./Badge";
import { DashboardSectionHeader } from "./DashboardSectionHeader";
import { EmptyState } from "./EmptyState";
import { SkeletonBlock } from "../../../_components/ui/skeleton";
import { buttonClassName } from "@/src/components/ui/button";
import { PanelCard } from "@/src/components/ui/panel-card";
import type { DashboardActionCardsMode } from "@/src/lib/dashboard/action-cards";
import type { GrowDashboardModel, GrowDashboardTone } from "@/src/lib/dashboard/grow-model";

type GrowDashboardSectionProps = {
  model: GrowDashboardModel | null;
  loading: boolean;
  actionMode: DashboardActionCardsMode;
  ctaLabel: string;
  ctaHref: string;
};

type GrowMetricCardProps = {
  label: string;
  value: string;
  subtext: string;
  tone: GrowDashboardTone;
};

function toBadgeVariant(tone: GrowDashboardTone): "good" | "warn" | "neutral" {
  if (tone === "positive") {
    return "good";
  }
  if (tone === "warning") {
    return "warn";
  }

  return "neutral";
}

function formatPercent(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Tracking";
  }

  const absolute = Math.abs(Math.round(value * 10) / 10);
  const formatted = Number.isInteger(absolute) ? absolute.toFixed(0) : absolute.toFixed(1);
  if (value > 0) {
    return `+${formatted}%`;
  }
  if (value < 0) {
    return `-${formatted}%`;
  }

  return "0%";
}

function formatScore(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Pending";
  }

  return `${value}/100`;
}

function formatSourceUpdatedLabel(value: string | null): string {
  return value ? `Updated ${value}` : "Using the latest available dashboard evidence.";
}

function GrowMetricCard({ label, value, subtext, tone }: GrowMetricCardProps) {
  return (
    <article className="rounded-[1.2rem] border border-brand-border-strong/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.95),rgba(19,41,80,0.9),rgba(16,32,67,0.96))] p-5 shadow-brand-card">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">{label}</p>
        <Badge variant={toBadgeVariant(tone)}>{tone === "positive" ? "Positive" : tone === "warning" ? "Warning" : "Neutral"}</Badge>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-brand-text-primary">{value}</p>
      <p className="mt-3 text-sm leading-relaxed text-brand-text-secondary">{subtext}</p>
    </article>
  );
}

function renderLoadingState() {
  return (
    <div className="space-y-4" data-testid="grow-dashboard-loading">
      <PanelCard className="border-brand-border-strong/80 bg-[linear-gradient(155deg,rgba(16,32,67,0.95),rgba(19,41,80,0.92),rgba(16,32,67,0.96))]">
        <div className="space-y-4">
          <SkeletonBlock className="h-3 w-32 bg-brand-border/70" />
          <SkeletonBlock className="h-16 w-40 bg-brand-border/60" />
          <SkeletonBlock className="h-4 w-full bg-brand-border/55" />
          <SkeletonBlock className="h-4 w-4/5 bg-brand-border/45" />
        </div>
      </PanelCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <PanelCard key={index} className="border-brand-border/75 bg-[linear-gradient(155deg,rgba(19,41,80,0.74),rgba(16,32,67,0.9))]">
            <div className="space-y-3">
              <SkeletonBlock className="h-3 w-24 bg-brand-border/60" />
              <SkeletonBlock className="h-10 w-24 bg-brand-border/50" />
              <SkeletonBlock className="h-3 w-full bg-brand-border/45" />
              <SkeletonBlock className="h-3 w-4/5 bg-brand-border/35" />
            </div>
          </PanelCard>
        ))}
      </div>
    </div>
  );
}

function renderLockedPlaybook() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-brand-border-strong/80 bg-[linear-gradient(155deg,rgba(16,32,67,0.95),rgba(23,49,117,0.78),rgba(15,118,110,0.32))] p-5 shadow-brand-card"
      data-testid="grow-dashboard-playbook-locked"
    >
      <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-brand-accent-blue/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-14 bottom-[-4.5rem] h-36 w-36 rounded-full bg-brand-accent-emerald/16 blur-3xl" />
      <div className="relative space-y-3">
        <p className="inline-flex rounded-full border border-brand-border-strong/80 bg-brand-panel/72 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-accent-teal">
          PRO FEATURE
        </p>
        <p className="text-sm leading-relaxed text-brand-text-secondary">
          Upgrade to Pro to unlock growth playbooks, top opportunities, and prioritized next actions.
        </p>
        <Link href="/app/billing" className={buttonClassName({ variant: "primary", size: "sm", className: "px-4 shadow-brand-glow" })}>
          Upgrade to Pro
        </Link>
      </div>
    </div>
  );
}

function renderLoadingPlaybook() {
  return (
    <div
      className="rounded-2xl border border-brand-border/75 bg-[linear-gradient(155deg,rgba(19,41,80,0.74),rgba(16,32,67,0.86))] p-4"
      data-testid="grow-dashboard-playbook-loading"
    >
      <p className="text-sm text-brand-text-secondary">Checking plan access for growth playbooks...</p>
      <div className="mt-3 space-y-2">
        <div className="h-2.5 w-full animate-pulse rounded-full bg-brand-border/70" />
        <div className="h-2.5 w-4/5 animate-pulse rounded-full bg-brand-border/55" />
      </div>
    </div>
  );
}

function renderHero(model: GrowDashboardModel) {
  const summaryTone = model.latestGrowthSummary?.tone ?? "neutral";

  return (
    <PanelCard className="relative overflow-hidden border-brand-border-strong/80 bg-[linear-gradient(145deg,rgba(16,32,67,0.95),rgba(19,41,80,0.94),rgba(16,32,67,0.96))] p-0 shadow-brand-card">
      <div className="pointer-events-none absolute -left-20 top-[-5rem] h-64 w-64 rounded-full bg-brand-accent-blue/20 blur-3xl" />
      <div className="pointer-events-none absolute right-[-6rem] top-20 h-56 w-56 rounded-full bg-brand-accent-emerald/14 blur-3xl" />
      <div className="relative grid gap-6 p-6 md:grid-cols-[minmax(0,0.95fr),minmax(0,1.05fr)] md:p-7" data-testid="grow-dashboard-hero">
        {model.creatorScore ? (
          <article className="rounded-[1.35rem] border border-brand-border-strong/80 bg-brand-panel/88 px-5 py-6 shadow-brand-glow md:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-brand-text-secondary">Creator Score</p>
              <Badge variant={toBadgeVariant(summaryTone)}>
                {summaryTone === "positive" ? "Strong signal" : summaryTone === "warning" ? "Watch closely" : "Measured signal"}
              </Badge>
            </div>
            <div className="mt-4 flex items-end gap-2">
              <p className="text-6xl font-semibold leading-none tracking-tight text-brand-text-primary md:text-7xl">{model.creatorScore.score}</p>
              <p className="pb-2 text-sm text-brand-text-muted md:text-base">/100</p>
            </div>
            <h3 className="mt-5 text-xl font-semibold text-brand-text-primary">
              {model.latestGrowthSummary?.label ?? "Latest growth summary"}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">
              {model.latestGrowthSummary?.body ?? model.creatorScore.label}
            </p>
            <p className="mt-4 text-xs uppercase tracking-[0.14em] text-brand-text-muted">{formatSourceUpdatedLabel(model.sourceUpdatedLabel)}</p>
          </article>
        ) : (
          <article
            className="rounded-[1.35rem] border border-brand-border-strong/80 bg-brand-panel/88 px-5 py-6 shadow-brand-glow md:px-6"
            data-testid="grow-dashboard-partial"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-brand-text-secondary">Grow Status</p>
              <Badge variant={toBadgeVariant(summaryTone)}>Limited view</Badge>
            </div>
            <h3 className="mt-5 text-2xl font-semibold tracking-tight text-brand-text-primary md:text-3xl">
              Measured growth scores are not available yet.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-brand-text-secondary">
              {model.latestGrowthSummary?.body ??
                "Grow can show guidance now. Measured scorecards will appear when supported audience and engagement analytics are available."}
            </p>
            <p className="mt-4 text-xs uppercase tracking-[0.14em] text-brand-text-muted">{formatSourceUpdatedLabel(model.sourceUpdatedLabel)}</p>
          </article>
        )}

        {model.growthHealth ? (
          <article className="rounded-[1.25rem] border border-brand-border/75 bg-[linear-gradient(160deg,rgba(19,41,80,0.82),rgba(16,32,67,0.92))] p-5 shadow-brand-card">
            <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Growth Health</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="text-4xl font-semibold tracking-tight text-brand-text-primary">{model.growthHealth.value}</p>
              <Badge variant={toBadgeVariant(model.growthHealth.tone)}>
                {model.growthHealth.tone === "positive" ? "Healthy" : model.growthHealth.tone === "warning" ? "Needs focus" : "Developing"}
              </Badge>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-brand-text-secondary">{model.creatorScore?.label}</p>
            {model.growthHealth.trend ? <p className="mt-3 text-sm text-brand-text-muted">{model.growthHealth.trend}</p> : null}
          </article>
        ) : (
          <article className="rounded-[1.25rem] border border-brand-border/75 bg-[linear-gradient(160deg,rgba(19,41,80,0.82),rgba(16,32,67,0.92))] p-5 shadow-brand-card">
            <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Growth Readiness</p>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-brand-text-primary">
              {model.availability === "structured" ? "Structured signals are available." : "Grow is waiting for measured analytics."}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-brand-text-secondary">
              {model.availability === "structured"
                ? "Supported audience and engagement inputs are present, but an explicit creator score is not available in this workspace yet."
                : "Grow will show measured scorecards when supported audience and engagement analytics are added."}
            </p>
          </article>
        )}
      </div>
    </PanelCard>
  );
}

function renderPostingWindowPanel(model: GrowDashboardModel) {
  if (!model.bestPostingWindow) {
    return (
      <PanelCard
        title="What Grow Will Show"
        description="Structured timing, audience, and engagement inputs unlock richer growth cards."
        className="border-brand-border/75 bg-[linear-gradient(160deg,rgba(19,41,80,0.8),rgba(16,32,67,0.92))]"
      >
        <div className="space-y-3" data-testid="grow-dashboard-what-grow-shows">
          <p className="text-sm leading-relaxed text-brand-text-secondary">
            Grow will add measured creator scores, comparable audience-growth velocity, audience quality, and best posting windows when supported analytics are available.
          </p>
          <ul className="space-y-2 text-sm text-brand-text-secondary">
            <li>Creator score from supported audience and engagement scoring inputs.</li>
            <li>Growth velocity from comparable follower or audience deltas.</li>
            <li>Best posting windows from explicit activity-by-time evidence.</li>
          </ul>
        </div>
      </PanelCard>
    );
  }

  return (
    <PanelCard
      title="Best Posting Window"
      description="Available when current dashboard inputs include explicit timing evidence."
      className="border-brand-border/75 bg-[linear-gradient(160deg,rgba(19,41,80,0.8),rgba(16,32,67,0.92))]"
    >
      <div className="space-y-4" data-testid="grow-dashboard-posting-window">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Primary window</p>
          <p className="mt-2 text-lg font-semibold text-brand-text-primary">{model.bestPostingWindow.primaryWindow ?? "Waiting for explicit timing evidence"}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Secondary window</p>
          <p className="mt-2 text-sm text-brand-text-primary">{model.bestPostingWindow.secondaryWindow ?? "No secondary posting window is available yet."}</p>
        </div>
        {model.bestPostingWindow.rationale ? <p className="text-sm leading-relaxed text-brand-text-secondary">{model.bestPostingWindow.rationale}</p> : null}
      </div>
    </PanelCard>
  );
}

function renderPlaybookPanel(model: GrowDashboardModel, actionMode: DashboardActionCardsMode) {
  const hasPlaybookContent = Boolean(model.topOpportunity) || model.nextActions.length > 0;

  return (
    <PanelCard
      title={hasPlaybookContent ? "Growth Playbook" : "Grow Guidance"}
      description={
        hasPlaybookContent
          ? "Top opportunity and the next three moves from the current normalized growth path."
          : "Guidance stays limited until supported analytics produce a clear, growth-derived opportunity."
      }
      className="border-brand-border/75 bg-[linear-gradient(160deg,rgba(19,41,80,0.8),rgba(16,32,67,0.92))]"
    >
      {!hasPlaybookContent ? (
        <div className="space-y-3" data-testid="grow-dashboard-guidance">
          <p className="text-sm leading-relaxed text-brand-text-secondary">
            Grow is ready to surface a top opportunity and up to three next actions once supported audience and engagement analytics are available.
          </p>
          <p className="text-sm leading-relaxed text-brand-text-secondary">
            Until then, use Earn for current performance tracking and return to Grow when richer audience evidence lands.
          </p>
        </div>
      ) : actionMode === "loading" ? (
        renderLoadingPlaybook()
      ) : actionMode === "locked" ? (
        renderLockedPlaybook()
      ) : (
        <div className="space-y-5" data-testid="grow-dashboard-playbook">
          {model.topOpportunity ? (
            <article className="rounded-2xl border border-brand-border/70 bg-brand-panel/82 p-4 shadow-brand-card">
              <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Top opportunity</p>
              <h3 className="mt-3 text-lg font-semibold text-brand-text-primary">{model.topOpportunity.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">{model.topOpportunity.summary}</p>
              {model.topOpportunity.estimatedImpact ? (
                <p className="mt-3 text-xs uppercase tracking-[0.14em] text-brand-text-muted">{model.topOpportunity.estimatedImpact}</p>
              ) : null}
            </article>
          ) : null}

          {model.nextActions.length > 0 ? (
            <div data-testid="grow-dashboard-actions">
              <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Next actions</p>
              <ol className="mt-3 space-y-3">
                {model.nextActions.map((action, index) => (
                  <li
                    key={`${action.title}-${index}`}
                    className="rounded-2xl border border-brand-border/70 bg-[linear-gradient(155deg,rgba(19,41,80,0.78),rgba(16,32,67,0.88))] p-4 shadow-brand-card"
                  >
                    <p className="text-sm font-medium text-brand-text-primary">{action.title}</p>
                    {action.impact ? <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">{action.impact}</p> : null}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
      )}
    </PanelCard>
  );
}

export function GrowDashboardSection({ model, loading, actionMode, ctaLabel, ctaHref }: GrowDashboardSectionProps) {
  const metricCards: GrowMetricCardProps[] = [];

  if (model?.engagementHealth) {
    metricCards.push({
      label: "Engagement Health",
      value: model.engagementHealth.rate !== undefined ? formatPercent(model.engagementHealth.rate) : "Pending",
      subtext: model.engagementHealth.label,
      tone: model.engagementHealth.tone,
    });
  }

  if (model?.growthVelocity) {
    metricCards.push({
      label: "Growth Velocity",
      value: model.growthVelocity.weeklyGrowthRate !== undefined ? formatPercent(model.growthVelocity.weeklyGrowthRate) : "Tracking",
      subtext: model.growthVelocity.label,
      tone: model.growthVelocity.tone,
    });
  }

  if (model?.audienceValue) {
    metricCards.push({
      label: "Audience Value",
      value: formatScore(model.audienceValue.score),
      subtext: model.audienceValue.label,
      tone: model.growthHealth?.tone ?? "neutral",
    });
  }

  return (
    <section className="space-y-4" data-testid="grow-dashboard-section">
      <DashboardSectionHeader title="Growth Dashboard" description="Supported audience and engagement signals from the latest dashboard evidence." />

      {loading && !model ? (
        renderLoadingState()
      ) : model ? (
        <>
          {renderHero(model)}

          {metricCards.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="grow-dashboard-metrics">
              {metricCards.map((card) => (
                <GrowMetricCard key={card.label} label={card.label} value={card.value} subtext={card.subtext} tone={card.tone} />
              ))}
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.88fr),minmax(0,1.12fr)]">
            {renderPostingWindowPanel(model)}
            {renderPlaybookPanel(model, actionMode)}
          </div>
        </>
      ) : (
        <PanelCard className="border-brand-border/75 bg-[linear-gradient(160deg,rgba(19,41,80,0.78),rgba(16,32,67,0.9))]">
          <div data-testid="grow-dashboard-empty">
            <EmptyState
              title="Growth insights are not available for this workspace yet."
              body="Earn is available now. Grow will unlock when supported audience and engagement analytics are added."
              ctaLabel={ctaLabel}
              ctaHref={ctaHref}
              appearance="dashboard"
            />
          </div>
        </PanelCard>
      )}
    </section>
  );
}
