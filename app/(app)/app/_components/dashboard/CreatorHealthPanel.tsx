import Link from "next/link";
import { Badge } from "./Badge";
import { EmptyState } from "./EmptyState";
import { SkeletonBlock } from "../../../_components/ui/skeleton";
import { buttonClassName } from "@/src/components/ui/button";
import { PanelCard } from "@/src/components/ui/panel-card";
import type { DashboardViewModel } from "@/src/lib/dashboard/view-model";

type LatestReportRow = {
  id: string;
  date: string;
  status: string;
};

type BadgeVariant = "good" | "warn" | "neutral";

type CreatorHealthPanelProps = {
  creatorHealth: DashboardViewModel["creatorHealth"];
  entitled: boolean;
  planTier: string;
  planStatusLabel: string;
  planStatusVariant: BadgeVariant;
  loading: boolean;
  workspaceReadiness: string;
  reportsCheckError: string | null;
  platformsConnectedLabel: string;
  coverageLabel: string;
  lastUploadLabel: string;
  latestReportRow: LatestReportRow | null;
  latestReportHref: string;
  latestReportStatusLabel: string;
  latestReportStatusVariant: BadgeVariant;
  ctaLabel: string;
  ctaHref: string;
};

type ScoreTrajectory = {
  label: string;
  className: string;
  dotClassName: string;
};

function resolveScoreTrajectory(score: number | null): ScoreTrajectory {
  if (score === null) {
    return {
      label: "Trajectory unlocks after your next report.",
      className: "border-brand-border/70 bg-brand-panel/70 text-brand-text-secondary",
      dotClassName: "bg-brand-text-muted",
    };
  }

  if (score >= 85) {
    return {
      label: "Trajectory: Strong and improving.",
      className: "border-emerald-300/45 bg-emerald-500/15 text-emerald-100",
      dotClassName: "bg-emerald-300",
    };
  }

  if (score >= 70) {
    return {
      label: "Trajectory: Healthy and stable.",
      className: "border-sky-300/45 bg-sky-500/15 text-sky-100",
      dotClassName: "bg-sky-300",
    };
  }

  if (score >= 55) {
    return {
      label: "Trajectory: Mixed, watch key shifts.",
      className: "border-amber-300/45 bg-amber-500/15 text-amber-100",
      dotClassName: "bg-amber-300",
    };
  }

  return {
    label: "Trajectory: At risk, needs action.",
    className: "border-amber-300/50 bg-amber-500/20 text-amber-100",
    dotClassName: "bg-amber-200",
  };
}

export function CreatorHealthPanel({
  creatorHealth,
  entitled,
  planTier,
  planStatusLabel,
  planStatusVariant,
  loading,
  workspaceReadiness,
  reportsCheckError,
  platformsConnectedLabel,
  coverageLabel,
  lastUploadLabel,
  latestReportRow,
  latestReportHref,
  latestReportStatusLabel,
  latestReportStatusVariant,
  ctaLabel,
  ctaHref,
}: CreatorHealthPanelProps) {
  const trajectory = resolveScoreTrajectory(creatorHealth.score);
  const supportCardClassName =
    "rounded-[1.15rem] border border-brand-border/75 bg-[linear-gradient(160deg,rgba(19,41,80,0.84),rgba(16,32,67,0.9))] p-5 shadow-brand-card";

  return (
    <section className="space-y-3" data-testid="dashboard-section-creator-health">
      <PanelCard
        rightSlot={
          <Link
            href={ctaHref}
            className={buttonClassName({
              variant: "secondary",
              size: "sm",
              className: "border-brand-border-strong/80 bg-brand-panel/80 shadow-brand-card hover:bg-brand-panel-muted/90",
            })}
          >
            {ctaLabel}
          </Link>
        }
        className="relative overflow-hidden border-brand-border-strong/80 bg-[linear-gradient(145deg,rgba(16,32,67,0.95),rgba(19,41,80,0.94),rgba(16,32,67,0.96))] p-0 shadow-brand-card"
      >
        <div className="pointer-events-none absolute -left-24 top-[-5.5rem] h-72 w-72 rounded-full bg-brand-accent-blue/22 blur-3xl" />
        <div className="pointer-events-none absolute right-[-7rem] top-20 h-64 w-64 rounded-full bg-brand-accent-emerald/16 blur-3xl" />
        <div className="relative space-y-6 p-6 md:p-7" data-testid="creator-health-panel">
          <article className="rounded-[1.35rem] border border-brand-border-strong/80 bg-brand-panel/88 px-5 py-6 shadow-brand-glow md:px-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-brand-text-secondary">Creator Health Score</p>
            <div className="mt-3 flex items-end gap-2">
              <p className="text-6xl font-semibold leading-none tracking-tight text-brand-text-primary md:text-7xl">
                {creatorHealth.score !== null ? creatorHealth.score : "--"}
              </p>
              {creatorHealth.score !== null ? <p className="pb-2 text-sm text-brand-text-muted md:text-base">/100</p> : null}
            </div>
            <p
              className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium tracking-[0.08em] ${trajectory.className}`}
              data-testid="creator-health-trajectory"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${trajectory.dotClassName}`} />
              {trajectory.label}
            </p>
            <h3 className="mt-5 text-xl font-semibold text-brand-text-primary">{creatorHealth.title}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-text-secondary">{creatorHealth.subtitle}</p>
          </article>

          <div className="grid gap-4 md:grid-cols-2">
            <article className={supportCardClassName}>
              <h3 className="text-sm font-semibold text-brand-text-primary">Plan & Access</h3>
              <dl className="mt-4 space-y-3.5">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-brand-text-secondary">Plan tier</dt>
                  <dd className="mt-1 text-sm font-medium text-brand-text-primary">{planTier}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-brand-text-secondary">Status</dt>
                  <dd className="mt-1">
                    <Badge variant={planStatusVariant}>{planStatusLabel}</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-brand-text-secondary">Gated state</dt>
                  <dd className="mt-1 text-sm font-medium text-brand-text-primary">{entitled ? "Active" : "Upgrade required"}</dd>
                </div>
              </dl>
            </article>

            <article className={supportCardClassName}>
              <h3 className="text-sm font-semibold text-brand-text-primary">Workspace Readiness</h3>
              {loading ? (
                <div className="space-y-2 pt-4">
                  <SkeletonBlock className="h-3 w-36 bg-brand-border/65" />
                  <SkeletonBlock className="h-3 w-48 bg-brand-border/50" />
                </div>
              ) : (
                <p className="mt-4 text-sm leading-relaxed text-brand-text-primary">{workspaceReadiness}</p>
              )}
              {!loading && reportsCheckError ? <p className="mt-1 text-xs text-brand-text-muted">{reportsCheckError}</p> : null}
            </article>

            <article className={supportCardClassName}>
              <h3 className="text-sm font-semibold text-brand-text-primary">Data Footprint</h3>
              <dl className="mt-4 space-y-3.5">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-brand-text-secondary">Platforms connected</dt>
                  <dd className="mt-1 text-sm font-medium text-brand-text-primary">{platformsConnectedLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-brand-text-secondary">Coverage</dt>
                  <dd className="mt-1 text-sm font-medium text-brand-text-primary">{coverageLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-brand-text-secondary">Last upload</dt>
                  <dd className="mt-1 text-sm font-medium text-brand-text-primary">{lastUploadLabel}</dd>
                </div>
              </dl>
            </article>

            <article className={supportCardClassName}>
              <h3 className="text-sm font-semibold text-brand-text-primary">Latest Report</h3>
              {latestReportRow ? (
                <div className="mt-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-border-strong/70 bg-brand-panel/88 px-3 py-2.5">
                    <div>
                      <p className="text-sm text-brand-text-primary">{latestReportRow.date}</p>
                    </div>
                    <Badge variant={latestReportStatusVariant}>{latestReportStatusLabel}</Badge>
                    <Link href={latestReportHref} className={buttonClassName({ variant: "primary", size: "sm" })}>
                      View
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <EmptyState
                    title={loading ? "Loading report data..." : "No reports generated yet."}
                    body="Upload your data and generate analysis to see report quality and summaries here."
                    ctaLabel={ctaLabel}
                    ctaHref={ctaHref}
                    appearance="dashboard"
                  />
                </div>
              )}
            </article>
          </div>
        </div>
      </PanelCard>
    </section>
  );
}
