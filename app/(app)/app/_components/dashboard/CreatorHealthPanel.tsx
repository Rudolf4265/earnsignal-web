import Link from "next/link";
import { Badge } from "./Badge";
import { DashboardSectionHeader } from "./DashboardSectionHeader";
import { EmptyState } from "./EmptyState";
import { SkeletonBlock } from "../../../_components/ui/skeleton";
import { buttonClassName } from "@/src/components/ui/button";
import { PanelCard } from "@/src/components/ui/panel-card";

type LatestReportRow = {
  id: string;
  date: string;
  status: string;
};

type BadgeVariant = "good" | "warn" | "neutral";

type CreatorHealthPanelProps = {
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

export function CreatorHealthPanel({
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
  return (
    <section className="space-y-4" data-testid="dashboard-section-creator-health">
      <DashboardSectionHeader title="Creator Health" description="Current access, data readiness, and most recent report status." />
      <PanelCard
        rightSlot={
          <Link href={ctaHref} className={buttonClassName({ variant: "secondary", size: "sm" })}>
            {ctaLabel}
          </Link>
        }
        className="p-0"
      >
        <div className="grid gap-5 p-6 lg:grid-cols-2" data-testid="creator-health-panel">
          <article className="rounded-2xl border border-brand-border bg-brand-panel-muted/70 p-4">
            <h3 className="text-sm font-semibold text-brand-text-primary">Access</h3>
            <dl className="mt-3 space-y-3">
              <div>
                <dt className="text-xs uppercase tracking-wide text-brand-text-secondary">Plan tier</dt>
                <dd className="mt-1 text-sm text-brand-text-primary">{planTier}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-brand-text-secondary">Status</dt>
                <dd className="mt-1">
                  <Badge variant={planStatusVariant}>{planStatusLabel}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-brand-text-secondary">Gated state</dt>
                <dd className="mt-1 text-sm text-brand-text-primary">{entitled ? "Active" : "Upgrade required"}</dd>
              </div>
            </dl>
          </article>

          <article className="rounded-2xl border border-brand-border bg-brand-panel-muted/70 p-4">
            <h3 className="text-sm font-semibold text-brand-text-primary">Workspace Readiness</h3>
            {loading ? (
              <div className="space-y-2 pt-4">
                <SkeletonBlock className="h-3 w-36 bg-slate-200" />
                <SkeletonBlock className="h-3 w-48 bg-slate-200" />
              </div>
            ) : (
              <p className="mt-3 text-sm text-brand-text-primary">{workspaceReadiness}</p>
            )}
            {!loading && reportsCheckError ? <p className="mt-1 text-xs text-brand-text-muted">{reportsCheckError}</p> : null}
          </article>

          <article className="rounded-2xl border border-brand-border bg-brand-panel-muted/70 p-4">
            <h3 className="text-sm font-semibold text-brand-text-primary">Data Footprint</h3>
            <dl className="mt-3 space-y-3">
              <div>
                <dt className="text-xs uppercase tracking-wide text-brand-text-secondary">Platforms connected</dt>
                <dd className="mt-1 text-sm text-brand-text-primary">{platformsConnectedLabel}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-brand-text-secondary">Coverage</dt>
                <dd className="mt-1 text-sm text-brand-text-primary">{coverageLabel}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-brand-text-secondary">Last upload</dt>
                <dd className="mt-1 text-sm text-brand-text-primary">{lastUploadLabel}</dd>
              </div>
            </dl>
          </article>

          <article className="rounded-2xl border border-brand-border bg-brand-panel-muted/70 p-4">
            <h3 className="text-sm font-semibold text-brand-text-primary">Latest Report</h3>
            {latestReportRow ? (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-border bg-brand-panel px-3 py-2">
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
                />
              </div>
            )}
          </article>
        </div>
      </PanelCard>
    </section>
  );
}
