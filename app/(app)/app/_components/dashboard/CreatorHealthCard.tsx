import Link from "next/link";
import { Badge } from "./Badge";
import { SkeletonBlock } from "../../../_components/ui/skeleton";
import { buttonClassName } from "@/src/components/ui/button";

export type CreatorHealthCardProps = {
  score?: number | null;
  trajectoryLabel?: string | null;
  latestReport?: {
    id: string;
    dateLabel: string;
    statusLabel?: string;
    summary?: string;
  } | null;
  reportHref?: string;
  loading?: boolean;
};

export function CreatorHealthCard({ score = null, trajectoryLabel, latestReport, reportHref, loading = false }: CreatorHealthCardProps) {
  return (
    <article
      className="flex h-full flex-col rounded-[1.5rem] border border-brand-border-strong/80 bg-[linear-gradient(145deg,rgba(16,32,67,0.95),rgba(19,41,80,0.94),rgba(16,32,67,0.96))] p-6 shadow-brand-card"
      data-testid="dashboard-creator-health-card"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-text-secondary">Business status</p>
        {latestReport?.statusLabel ? <Badge variant="neutral">{latestReport.statusLabel}</Badge> : null}
      </div>

      {loading ? (
        <div className="mt-6 flex flex-1 flex-col justify-between gap-5">
          <div className="space-y-3">
            <SkeletonBlock className="h-16 w-28 bg-brand-border/60" />
            <SkeletonBlock className="h-6 w-48 bg-brand-border/50" />
            <SkeletonBlock className="h-4 w-full bg-brand-border/40" />
            <SkeletonBlock className="h-4 w-5/6 bg-brand-border/35" />
          </div>
          <div className="space-y-3 rounded-[1.1rem] border border-brand-border/65 bg-brand-panel/55 p-4">
            <SkeletonBlock className="h-4 w-28 bg-brand-border/45" />
            <SkeletonBlock className="h-4 w-44 bg-brand-border/35" />
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-1 flex-col justify-between gap-5">
          <div className="space-y-4">
            {typeof score === "number" ? (
              <div className="flex items-end gap-2">
                <p className="text-6xl font-semibold leading-none tracking-tight text-brand-text-primary">{Math.round(score)}</p>
                <p className="pb-2 text-sm text-brand-text-muted">/100</p>
              </div>
            ) : (
              <div className="rounded-[1.15rem] border border-brand-border/70 bg-brand-panel/55 p-4">
                <p className="text-sm font-semibold text-brand-text-primary">Run your first report</p>
                <p className="mt-1.5 text-sm leading-relaxed text-brand-text-secondary">
                  Creator health appears after a completed report with enough evidence to score it confidently.
                </p>
              </div>
            )}

            {trajectoryLabel ? (
              <p className="inline-flex items-center rounded-full border border-brand-border/70 bg-brand-panel/60 px-3 py-1 text-xs font-medium text-brand-text-secondary">
                {trajectoryLabel}
              </p>
            ) : null}
          </div>

          <div className="rounded-[1.15rem] border border-brand-border/70 bg-brand-panel/60 p-4">
            {latestReport ? (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text-secondary">Latest report</p>
                <p className="text-base font-semibold text-brand-text-primary">{latestReport.dateLabel}</p>
                <p className="text-sm leading-relaxed text-brand-text-secondary">
                  {latestReport.summary ?? "Use the latest report as your current dashboard baseline."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text-secondary">Latest report</p>
                <p className="text-sm leading-relaxed text-brand-text-secondary">
                  Run your first report to unlock a stable dashboard baseline and a creator health score.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-5">
        <Link
          href={latestReport ? reportHref ?? `/app/report/${latestReport.id}` : "/app/data"}
          className={buttonClassName({
            variant: latestReport ? "secondary" : "primary",
            className: latestReport
              ? "border-brand-border-strong/80 bg-brand-panel/80 shadow-brand-card hover:bg-brand-panel-muted/90"
              : "shadow-brand-glow",
          })}
        >
          {latestReport ? "Open report" : "Run your first report"}
        </Link>
      </div>
    </article>
  );
}
