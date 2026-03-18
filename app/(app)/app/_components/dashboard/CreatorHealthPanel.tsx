import Link from "next/link";
import { Badge } from "./Badge";
import { buttonClassName } from "@/src/components/ui/button";
import { PanelCard } from "@/src/components/ui/panel-card";
import type { DashboardViewModel } from "@/src/lib/dashboard/view-model";
import type { DashboardDiagnosisNotice } from "@/src/lib/dashboard/diagnosis";

type LatestReportRow = {
  id: string;
  date: string;
  status: string;
};

type BadgeVariant = "good" | "warn" | "neutral";

type CreatorHealthPanelProps = {
  creatorHealth: DashboardViewModel["creatorHealth"];
  loading: boolean;
  latestReportRow: LatestReportRow | null;
  latestReportHref: string;
  latestReportStatusLabel: string;
  latestReportStatusVariant: BadgeVariant;
  diagnosisNotice?: DashboardDiagnosisNotice | null;
};

type ScoreTrajectory = {
  label: string;
  className: string;
  dotClassName: string;
};

function resolveScoreTrajectory(score: number | null, stateLabel: string | null): ScoreTrajectory {
  if (score === null) {
    return {
      label: "Trajectory unlocks after your next report.",
      className: "border-brand-border/70 bg-brand-panel/70 text-brand-text-secondary",
      dotClassName: "bg-brand-text-muted",
    };
  }

  if (stateLabel) {
    return {
      label: "Trajectory: provisional, confirm next cycle.",
      className: "border-amber-300/45 bg-amber-500/15 text-amber-100",
      dotClassName: "bg-amber-300",
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
  loading,
  latestReportRow,
  latestReportHref,
  latestReportStatusLabel,
  latestReportStatusVariant,
  diagnosisNotice,
}: CreatorHealthPanelProps) {
  const trajectory = resolveScoreTrajectory(creatorHealth.score, creatorHealth.stateLabel);

  return (
    <section data-testid="dashboard-section-creator-health">
      <PanelCard className="relative overflow-hidden border-brand-border-strong/80 bg-[linear-gradient(145deg,rgba(16,32,67,0.95),rgba(19,41,80,0.94),rgba(16,32,67,0.96))] p-0 shadow-brand-card">
        <div className="pointer-events-none absolute -left-24 top-[-5.5rem] h-72 w-72 rounded-full bg-brand-accent-blue/22 blur-3xl" />
        <div className="pointer-events-none absolute right-[-7rem] top-20 h-64 w-64 rounded-full bg-brand-accent-emerald/16 blur-3xl" />

        <div className="relative p-6 md:p-7" data-testid="creator-health-panel">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-accent-teal">Primary health</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-brand-text-primary md:text-[2rem]">Creator Health</h2>
                <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-brand-text-secondary">
                  Your current revenue health score and the clearest stability read from the latest report.
                </p>
              </div>
              {creatorHealth.stateLabel ? <Badge variant={creatorHealth.stateTone ?? "neutral"}>{creatorHealth.stateLabel}</Badge> : null}
            </div>

            <article className="mt-5 rounded-[1.35rem] border border-brand-border-strong/80 bg-brand-panel/88 px-5 py-5 shadow-brand-glow md:px-6">
              <p className="text-[10px] uppercase tracking-[0.18em] text-brand-text-secondary">Creator Health Score</p>
              <div className="mt-2 flex items-end gap-2">
                <p className="text-6xl font-semibold leading-none tracking-tight text-brand-text-primary md:text-7xl">
                  {creatorHealth.score !== null ? creatorHealth.score : "--"}
                </p>
                {creatorHealth.score !== null ? <p className="pb-2 text-sm text-brand-text-muted md:text-base">/100</p> : null}
              </div>
              <p
                className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium tracking-[0.08em] ${trajectory.className}`}
                data-testid="creator-health-trajectory"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${trajectory.dotClassName}`} />
                {trajectory.label}
              </p>
              <h3 className="mt-4 text-lg font-semibold text-brand-text-primary">{creatorHealth.title}</h3>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-brand-text-secondary">{creatorHealth.subtitle}</p>
              {diagnosisNotice ? (
                <p className="mt-2 text-xs leading-relaxed text-brand-text-muted/80" data-testid="creator-health-diagnosis-notice">
                  <span className="font-medium text-amber-300/45">Confidence note:</span>{" "}
                  {diagnosisNotice.body}
                </p>
              ) : null}
            </article>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr),auto]">
            <div className="rounded-[1.2rem] border border-brand-border/75 bg-[linear-gradient(160deg,rgba(19,41,80,0.84),rgba(16,32,67,0.9))] p-4 shadow-brand-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Latest report</p>
                {latestReportRow ? <Badge variant={latestReportStatusVariant}>{latestReportStatusLabel}</Badge> : null}
              </div>
              {latestReportRow ? (
                <>
                  <p className="mt-2 text-base font-semibold text-brand-text-primary">{latestReportRow.date}</p>
                  <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">
                    Use this as the current baseline for revenue health, diagnosis, and next actions.
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">
                  {loading ? "Loading your latest report baseline..." : "Upload a supported CSV export and run a report to unlock a measured health baseline."}
                </p>
              )}
            </div>

            {latestReportRow ? (
              <Link
                href={latestReportHref}
                className={buttonClassName({
                  variant: "secondary",
                  size: "sm",
                  className: "self-start border-brand-border-strong/80 bg-brand-panel/80 shadow-brand-card hover:bg-brand-panel-muted/90",
                })}
              >
                Open report
              </Link>
            ) : null}
          </div>
        </div>
      </PanelCard>
    </section>
  );
}
