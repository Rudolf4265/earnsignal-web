import Link from "next/link";
import { Badge } from "./Badge";
import { EmptyState } from "./EmptyState";
import { SkeletonBlock } from "../../../_components/ui/skeleton";
import { buttonClassName } from "@/src/components/ui/button";

type LatestReportRow = {
  id: string;
  date: string;
  status: string;
};

type BadgeVariant = "good" | "warn" | "neutral";

type DashboardUtilitySectionProps = {
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

const utilityCardClassName =
  "rounded-[1.2rem] border border-brand-border/70 bg-[linear-gradient(160deg,rgba(18,38,73,0.78),rgba(11,24,50,0.9))] p-5 shadow-brand-card";

export function DashboardUtilitySection({
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
}: DashboardUtilitySectionProps) {
  return (
    <section className="space-y-3" data-testid="dashboard-section-workspace-overview">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-brand-text-muted">Workspace & Access</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-brand-text-primary">Account, readiness, and latest report</h2>
        <p className="mt-1 text-sm leading-relaxed text-brand-text-secondary">
          Lower-priority account and workspace details live here so your creator signals stay up front.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className={utilityCardClassName}>
          <h3 className="text-sm font-semibold text-brand-text-primary">Plan & access</h3>
          <dl className="mt-4 space-y-3.5">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Plan tier</dt>
              <dd className="mt-1 text-sm font-medium text-brand-text-primary">{planTier}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Status</dt>
              <dd className="mt-1">
                <Badge variant={planStatusVariant}>{planStatusLabel}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Access</dt>
              <dd className="mt-1 text-sm font-medium text-brand-text-primary">{entitled ? "Dashboard access is active." : "Upgrade is required for premium intelligence."}</dd>
            </div>
          </dl>
        </article>

        <article className={utilityCardClassName}>
          <h3 className="text-sm font-semibold text-brand-text-primary">Workspace status</h3>
          {loading ? (
            <div className="space-y-2 pt-4">
              <SkeletonBlock className="h-3 w-36 bg-brand-border/65" />
              <SkeletonBlock className="h-3 w-48 bg-brand-border/50" />
            </div>
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-brand-text-primary">{workspaceReadiness}</p>
          )}
          {!loading && reportsCheckError ? <p className="mt-2 text-xs leading-relaxed text-brand-text-muted">{reportsCheckError}</p> : null}
        </article>

        <article className={utilityCardClassName}>
          <h3 className="text-sm font-semibold text-brand-text-primary">Connected data</h3>
          <dl className="mt-4 space-y-3.5">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Platforms</dt>
              <dd className="mt-1 text-sm font-medium text-brand-text-primary">{platformsConnectedLabel}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Coverage</dt>
              <dd className="mt-1 text-sm font-medium text-brand-text-primary">{coverageLabel}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Last update</dt>
              <dd className="mt-1 text-sm font-medium text-brand-text-primary">{lastUploadLabel}</dd>
            </div>
          </dl>
        </article>

        <article className={utilityCardClassName}>
          <h3 className="text-sm font-semibold text-brand-text-primary">Latest report</h3>
          {latestReportRow ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-[1rem] border border-brand-border/75 bg-brand-panel/76 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium text-brand-text-primary">{latestReportRow.date}</p>
                  <Badge variant={latestReportStatusVariant}>{latestReportStatusLabel}</Badge>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">Open the latest completed report for full detail, evidence, and recommendations.</p>
              </div>
              <Link
                href={latestReportHref}
                className={buttonClassName({
                  variant: "secondary",
                  size: "sm",
                  className: "border-brand-border-strong/70 bg-brand-panel/80 shadow-brand-card hover:bg-brand-panel-muted/90",
                })}
              >
                Open latest report
              </Link>
            </div>
          ) : (
            <div className="mt-3">
              <EmptyState
                title={loading ? "Loading report detail..." : "No report is ready yet."}
                body="Generate a report to unlock your latest summary, evidence, and deeper dashboard context."
                ctaLabel={ctaLabel}
                ctaHref={ctaHref}
                appearance="dashboard"
              />
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
